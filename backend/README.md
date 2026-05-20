# Digital Yellow Pages — Backend

Django REST Framework backend for the Digital Yellow Pages platform.

---

## Project structure

```
yellowpages/
├── manage.py
├── requirements.txt
├── .env.example
├── yellowpages/          # project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/             # auth app (OTP + JWT)
│   ├── models.py         # User, OTP
│   ├── serializers.py
│   ├── views.py
│   ├── utils.py          # OTP generation, email, rate limit
│   └── urls.py
└── listings/             # business listings + search
    ├── models.py         # BusinessListing
    ├── serializers.py
    ├── views.py
    └── urls.py
```

---

## Setup

### 1. Create and activate virtual environment

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set at minimum SECRET_KEY
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Start the development server

```bash
python manage.py runserver
```

Server runs at `http://127.0.0.1:8000`

---

## API reference

### Auth endpoints — no token required

#### Request OTP
```
POST /api/auth/request-otp/
Content-Type: application/json

{ "email": "user@example.com" }
```
Response `200`:
```json
{ "detail": "OTP sent successfully. Check your email." }
```
In development the OTP prints to the terminal (console email backend).

Errors:
- `400` invalid email format
- `429` rate limit exceeded (3 requests per 10 minutes per email)

---

#### Verify OTP
```
POST /api/auth/verify-otp/
Content-Type: application/json

{ "email": "user@example.com", "otp": "123456" }
```
Response `200`:
```json
{
  "detail": "Verified successfully.",
  "is_new_user": true,
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>"
}
```
Errors:
- `400` wrong OTP, expired OTP, no OTP found
- `403` locked out after 5 wrong attempts

---

#### Refresh access token
```
POST /api/auth/refresh/
Content-Type: application/json

{ "refresh": "<refresh token>" }
```
Response `200`:
```json
{ "access": "<new access token>" }
```

---

#### Get current user
```
GET /api/auth/me/
Authorization: Bearer <access token>
```
Response `200`:
```json
{ "id": "uuid", "email": "user@example.com", "date_joined": "..." }
```

---

### Listing endpoints

#### Create listing (auth required)
```
POST /api/listings/
Authorization: Bearer <access token>
Content-Type: application/json

{
  "business_title": "Kathmandu Plumbers",
  "service_detail": "Professional plumbing and pipe repair for homes and offices in Kathmandu valley.",
  "phone_number": "+9779841000000",
  "business_email": "info@ktmplumbers.com",
  "location_url": "https://maps.google.com/?q=Kathmandu",
  "city": "Kathmandu",
  "region": "Bagmati"
}
```
Response `201`: full listing object.

Validation rules:
- `business_title`: 3–100 characters
- `service_detail`: minimum 20 characters
- `phone_number`: E.164 international format (e.g. +977XXXXXXXXX)
- `location_url`: must be a Google Maps, Apple Maps, or OpenStreetMap HTTPS URL

---

#### List my listings (auth required)
```
GET /api/listings/
Authorization: Bearer <access token>
```
Returns paginated list of the authenticated user's active listings.

---

#### Get single listing (public)
```
GET /api/listings/<uuid>/
```

---

#### Update listing (owner only)
```
PUT /api/listings/<uuid>/
Authorization: Bearer <access token>
Content-Type: application/json

{ "business_title": "Updated name" }   ← partial update supported
```

---

#### Delete listing (owner only, soft delete)
```
DELETE /api/listings/<uuid>/
Authorization: Bearer <access token>
```

---

#### Search (public)
```
GET /api/listings/search/?q=plumber&city=Kathmandu
```
Query parameters:
- `q` — keyword matched against title and service detail
- `city` — filter by city (case-insensitive)
- `region` — filter by region (case-insensitive)

At least one parameter is required. Results are paginated (20 per page).

---

## Security notes from SRS implemented

| Requirement | Implementation |
|---|---|
| OTP expires in 5 minutes | `OTP.is_expired()` checks `created_at` delta |
| Max 3 OTP requests per 10 min | `check_rate_limit()` in `accounts/utils.py` |
| Lockout after 5 wrong attempts | `OTP.attempts` counter, `is_locked_out()` check |
| E.164 phone validation | `phonenumbers` library in serializer |
| Secure map URL validation | Allowlist check in `ListingSerializer` |
| JWT auth on protected routes | `IsAuthenticated` + `JWTAuthentication` |
| CORS control | `django-cors-headers`, configured via `.env` |

---

## Moving to production

1. Set `DEBUG=False` in `.env`
2. Use a strong random `SECRET_KEY`
3. Switch `EMAIL_BACKEND` to SMTP and fill in credentials
4. Change `DATABASES` in `settings.py` from SQLite to PostgreSQL
5. Run behind gunicorn: `pip install gunicorn && gunicorn yellowpages.wsgi`
