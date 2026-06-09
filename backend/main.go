package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type resume interface {
	render() string
}

type personInfo struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Location string `json:"location"`
	Github   string `json:"github"`
	Photo    string `json:"photo"`
}

type educationInfo struct {
	SchoolName string `json:"school_name"`
	Date       string `json:"date"`
	Gpa        string `json:"gpa"`
}

type workInfo struct {
	Position string `json:"position"`
	Company  string `json:"company"`
	Date     string `json:"date"`
	Detail   string `json:"detail"`
}

type projectInfo struct {
	ProjectName string `json:"project_name"`
	Date        string `json:"date"`
	Detail      string `json:"detail"`
}

type skillInfo struct {
	SkillName string `json:"skill_name"`
}

type styleInfo struct {
	AccentColor string `json:"accent_color"`
	FontColor   string `json:"font_color"`
	FontFamily  string `json:"font_family"`
}

type Content struct {
	PersonInfo personInfo      `json:"personInfo"`
	Education  []educationInfo `json:"education"`
	Experience []workInfo      `json:"experience"`
	Project    []projectInfo   `json:"project"`
	Skill      []skillInfo     `json:"skill"`
	Style      styleInfo       `json:"style"`
}

type CreateResumeRequest struct {
	Title    string  `json:"title"`
	Template string  `json:"template"`
	Content  Content `json:"content"`
}

type info struct {
	name      string
	education string
	skill     string
}

type modern struct {
	info
}

type classic struct {
	info
}

func (m modern) render() string {
	return m.name + " | " + m.education + " | " + m.skill
}

func (c classic) render() string {
	return "name " + c.name + "\neducation " + c.education + "\nskill " + c.skill
}

func OpenTemplate(w http.ResponseWriter, r resume) {
	fmt.Fprint(w, r.render())
}

func AuthMiddleware(jwks keyfunc.Keyfunc) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "missing authorization header", http.StatusUnauthorized)
				return
			}
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.Parse(tokenString, jwks.KeyfuncCtx(r.Context()))
			if err != nil || !token.Valid {
				log.Println("JWT error:", err)
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "invalid claims", http.StatusUnauthorized)
				return
			}

			userID, ok := claims["sub"].(string)
			if !ok {
				http.Error(w, "no user id in token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), "userID", userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func main() {
	// Load .env for local development only. In production the host injects env
	// vars directly, so a missing .env file is expected and must not be fatal.
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on environment variables")
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		log.Fatal("SUPABASE_URL is not set")
	}

	// Fetch JWKS from Supabase for ES256 token verification
	jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"
	jwks, err := keyfunc.NewDefaultCtx(context.Background(), []string{jwksURL})
	if err != nil {
		log.Fatal("Failed to fetch JWKS:", err)
	}
	fmt.Println("✓ โหลด JWKS สำเร็จ")

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal("ต่อ database ไม่สำเร็จ:", err)
	}
	defer pool.Close()
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("ping database ไม่สำเร็จ:", err)
	}
	fmt.Println("✓ ต่อ database สำเร็จ")

	router := chi.NewRouter()

	// CORS: the Next.js frontend runs on a different origin, so the browser
	// sends a preflight OPTIONS request before any call carrying the
	// Authorization header. Allow the frontend origin(s) explicitly.
	// Set FRONTEND_URL (comma-separated) in prod; defaults to local dev.
	allowedOrigins := []string{"http://localhost:3000"}
	if origins := os.Getenv("FRONTEND_URL"); origins != "" {
		allowedOrigins = strings.Split(origins, ",")
	}
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"OK"}`)
	})

	router.Group(func(protected chi.Router) {
		protected.Use(AuthMiddleware(jwks))

		// GET /resumes - list all resumes for the authenticated user
		protected.Get("/resumes", func(w http.ResponseWriter, r *http.Request) {
			userID := r.Context().Value("userID").(string)

			rows, err := pool.Query(
				context.Background(),
				"SELECT id, title, template, is_public, slug, created_at, updated_at FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
				userID,
			)
			if err != nil {
				log.Println("query error:", err)
				http.Error(w, "failed to fetch resumes", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			type ResumeSummary struct {
				ID        string    `json:"id"`
				Title     string    `json:"title"`
				Template  string    `json:"template"`
				IsPublic  bool      `json:"is_public"`
				Slug      *string   `json:"slug"`
				CreatedAt time.Time `json:"created_at"`
				UpdatedAt time.Time `json:"updated_at"`
			}

			var resumes []ResumeSummary
			for rows.Next() {
				var r ResumeSummary
				if err := rows.Scan(&r.ID, &r.Title, &r.Template, &r.IsPublic, &r.Slug, &r.CreatedAt, &r.UpdatedAt); err != nil {
					log.Println("scan error:", err)
					continue
				}
				resumes = append(resumes, r)
			}

			if resumes == nil {
				resumes = []ResumeSummary{}
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resumes)
		})

		// GET /resume/{id} - get a single resume
		protected.Get("/resume/{id}", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			userID := r.Context().Value("userID").(string)

			var title, content, template string
			var isPublic bool
			var slug *string
			err := pool.QueryRow(
				context.Background(),
				"SELECT title, content, template, is_public, slug FROM resumes WHERE id = $1 AND user_id = $2",
				id, userID,
			).Scan(&title, &content, &template, &isPublic, &slug)

			if err != nil {
				http.Error(w, "resume not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"id":        id,
				"title":     title,
				"content":   json.RawMessage(content),
				"template":  template,
				"is_public": isPublic,
				"slug":      slug,
			})
		})

		// POST /resume - create a new resume
		protected.Post("/resume", func(w http.ResponseWriter, r *http.Request) {
			userID := r.Context().Value("userID").(string)

			var req CreateResumeRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid JSON", http.StatusBadRequest)
				return
			}

			contentJSON, err := json.Marshal(req.Content)
			if err != nil {
				http.Error(w, "failed to serialize content", http.StatusInternalServerError)
				return
			}

			var newID string
			err = pool.QueryRow(
				context.Background(),
				`INSERT INTO resumes (user_id, title, content, template)
				 VALUES ($1, $2, $3, $4)
				 RETURNING id`,
				userID, req.Title, string(contentJSON), req.Template,
			).Scan(&newID)

			if err != nil {
				log.Println("insert error:", err)
				http.Error(w, "failed to create resume", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(map[string]string{"id": newID})
		})

		// PUT /resume/{id} - update an existing resume
		protected.Put("/resume/{id}", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			userID := r.Context().Value("userID").(string)

			var req CreateResumeRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid JSON", http.StatusBadRequest)
				return
			}

			contentJSON, err := json.Marshal(req.Content)
			if err != nil {
				http.Error(w, "failed to serialize content", http.StatusInternalServerError)
				return
			}

			result, err := pool.Exec(
				context.Background(),
				`UPDATE resumes SET title = $1, content = $2, template = $3, updated_at = NOW()
				 WHERE id = $4 AND user_id = $5`,
				req.Title, string(contentJSON), req.Template, id, userID,
			)

			if err != nil {
				log.Println("update error:", err)
				http.Error(w, "failed to update resume", http.StatusInternalServerError)
				return
			}

			if result.RowsAffected() == 0 {
				http.Error(w, "resume not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "updated"})
		})

		// DELETE /resume/{id} - delete a resume
		protected.Delete("/resume/{id}", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			userID := r.Context().Value("userID").(string)

			result, err := pool.Exec(
				context.Background(),
				"DELETE FROM resumes WHERE id = $1 AND user_id = $2",
				id, userID,
			)

			if err != nil {
				log.Println("delete error:", err)
				http.Error(w, "failed to delete resume", http.StatusInternalServerError)
				return
			}

			if result.RowsAffected() == 0 {
				http.Error(w, "resume not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "deleted"})
		})

		// POST /resume/{id}/share - publish a resume and return its public slug
		protected.Post("/resume/{id}/share", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			userID := r.Context().Value("userID").(string)

			// Fetch the current slug (and confirm ownership) so re-sharing keeps
			// the same public link instead of minting a new one each time.
			var slug *string
			err := pool.QueryRow(
				context.Background(),
				"SELECT slug FROM resumes WHERE id = $1 AND user_id = $2",
				id, userID,
			).Scan(&slug)
			if err != nil {
				http.Error(w, "resume not found", http.StatusNotFound)
				return
			}

			if slug == nil {
				s, err := generateSlug()
				if err != nil {
					http.Error(w, "failed to generate slug", http.StatusInternalServerError)
					return
				}
				slug = &s
			}

			_, err = pool.Exec(
				context.Background(),
				"UPDATE resumes SET is_public = true, slug = $1 WHERE id = $2 AND user_id = $3",
				*slug, id, userID,
			)
			if err != nil {
				log.Println("share error:", err)
				http.Error(w, "failed to share resume", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"slug":      *slug,
				"is_public": true,
			})
		})

		// DELETE /resume/{id}/share - make a resume private again (slug is kept)
		protected.Delete("/resume/{id}/share", func(w http.ResponseWriter, r *http.Request) {
			id := chi.URLParam(r, "id")
			userID := r.Context().Value("userID").(string)

			result, err := pool.Exec(
				context.Background(),
				"UPDATE resumes SET is_public = false WHERE id = $1 AND user_id = $2",
				id, userID,
			)
			if err != nil {
				log.Println("unshare error:", err)
				http.Error(w, "failed to unshare resume", http.StatusInternalServerError)
				return
			}
			if result.RowsAffected() == 0 {
				http.Error(w, "resume not found", http.StatusNotFound)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"is_public": false})
		})
	})

	// GET /public/resume/{slug} - fetch a published resume (no auth required)
	router.Get("/public/resume/{slug}", func(w http.ResponseWriter, r *http.Request) {
		slug := chi.URLParam(r, "slug")

		var title, content, template string
		err := pool.QueryRow(
			context.Background(),
			"SELECT title, content, template FROM resumes WHERE slug = $1 AND is_public = true",
			slug,
		).Scan(&title, &content, &template)
		if err != nil {
			http.Error(w, "resume not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"title":    title,
			"content":  json.RawMessage(content),
			"template": template,
		})
	})

	// Hosts (Render, Fly, Railway) inject the port to bind via $PORT.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Println("✓ listening on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

// generateSlug returns a random URL-safe slug for public resume links.
func generateSlug() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
