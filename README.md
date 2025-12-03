# Simple Node Server - Dokumentacja

## Architektura Projektu

### 🎯 Ogólny Przegląd

REST API do zarządzania użytkownikami z autoryzacją JWT. Projekt zbudowany na Node.js + Express z MongoDB (Mongoose) jako bazą danych.

### 🏗️ Struktura Architektoniczna

```
┌─────────────────┐
│  HTTP Request   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Routes  │  ← Endpointy API
    └────┬─────┘
         │
  ┌──────▼──────────┐
  │   Middleware    │  ← Autoryzacja JWT
  └──────┬──────────┘
         │
   ┌─────▼──────┐
   │  Services  │  ← Logika biznesowa
   └─────┬──────┘
         │
    ┌────▼─────┐
    │  Modules │  ← Walidacja, Generator, Repository
    └────┬─────┘
         │
   ┌─────▼──────┐
   │  Database  │  ← MongoDB (Mongoose)
   └────────────┘
```

## 📂 Organizacja Kodu

### **Routes** (`/routes/user/`)

Warstwa endpoint-ów HTTP - każdy plik = jeden endpoint:

- `userRegister.js` - POST `/auth/register`
- `userLogin.js` - POST `/auth/login`
- `userLogout.js` - POST `/auth/logout`
- `userProfile.js` - GET `/api/users/:username`
- `userList.js` - GET `/api/users`
- `userDelete.js` - DELETE `/api/users/me`

### **Middleware** (`/middleware/`)

- **`auth.js`** - Autoryzacja JWT, generowanie i weryfikacja tokenów

### **Services** (`/services/`)

**UserService** - główny orkiestrator logiki biznesowej

**Modules** (`/services/modules/`) - wyspecjalizowane moduły:

- **UserRepository** - operacje CRUD na bazie danych
- **UserValidator** - walidacja danych (email, hasło, duplikaty)
- **UsernameGenerator** - generowanie unikalnych nazw użytkownika
- **UserMigration** - migracja ze starych struktur danych

### **Models** (`/models/`)

- **User.js** - Mongoose schema dla użytkowników

## 🔐 Przepływ Autoryzacji

1. **Rejestracja**: `POST /auth/register`

   - Walidacja danych → Hashowanie hasła (bcrypt) → Zapis do DB → Zwrot tokenu JWT

2. **Logowanie**: `POST /auth/login`

   - Sprawdzenie username/email → Weryfikacja hasła → Generowanie tokenu JWT

3. **Zabezpieczone endpointy**:
   - Request zawiera: `Authorization: Bearer <token>`
   - Middleware `authenticateToken` weryfikuje JWT
   - Dekodowanie tokenu → Przypisanie `req.user` → Dostęp do zasobu

## 🔄 Przepływ Danych (Przykład: Rejestracja)

```
POST /auth/register
    ↓
userRegister.js (route)
    ↓
UserService.addUser()
    ↓
UserValidator.validateUserData()  → sprawdzenie formatu email, siły hasła, duplikatów
    ↓
UserRepository.create()  → zapis do MongoDB
    ↓
generateToken()  → utworzenie JWT
    ↓
Response: { user, token }
```

## 🛠️ Technologie

- **Node.js** + **Express** - serwer HTTP
- **MongoDB Atlas** + **Mongoose** - baza danych
- **JWT** (jsonwebtoken) - autoryzacja
- **bcrypt** - hashowanie haseł
- **nanoid** - generowanie unikalnych ID

## 🚀 Uruchomienie

```bash
npm install
npm start  # Produkcja (port 3000 lub PORT z .env)
npm run dev  # Development
```

### Wymagane zmienne środowiskowe (`.env`):

```
MONGO_USER=your_username
MONGO_PASSWORD=your_password
MONGO_CLUSTER=your_cluster.mongodb.net
MONGO_APP_NAME=your_app
JWT_SECRET=your_secret_key
```

## 📡 API Endpoints

| Metoda | Endpoint               | Opis                           | Auth |
| ------ | ---------------------- | ------------------------------ | ---- |
| POST   | `/auth/register`       | Rejestracja nowego użytkownika | ❌   |
| POST   | `/auth/login`          | Logowanie użytkownika          | ❌   |
| POST   | `/auth/logout`         | Wylogowanie                    | ✅   |
| GET    | `/api/users`           | Lista wszystkich użytkowników  | ❌   |
| GET    | `/api/users/:username` | Profil użytkownika             | ❌   |
| DELETE | `/api/users/me`        | Usunięcie własnego konta       | ✅   |

## 💡 Kluczowe Koncepcje

### **Separation of Concerns**

Każda warstwa ma swoją odpowiedzialność:

- Routes = HTTP handling
- Services = Business logic
- Modules = Specialized tasks
- Repository = Database operations

### **Modularność**

Modules (`UserValidator`, `UsernameGenerator`, itd.) mogą być używane niezależnie i testowane w izolacji.

### **Bezpieczeństwo**

- Hasła hashowane bcrypt
- JWT z czasem wygaśnięcia (5 min)
- Walidacja danych wejściowych
- Middleware autoryzacji dla chronionych endpoint-ów

## 📊 Struktura Użytkownika (MongoDB)

```javascript
{
  username: String (unique),
  email: String (unique),
  hashedPassword: String,
  isActivated: Boolean,
  createdAt: Date,
  _id: ObjectId
}
```

## 🔧 Utrzymanie i Rozwój

- **Dodanie nowego endpointu**: Utwórz plik w `/routes/`, zarejestruj w `server.js`
- **Nowa logika biznesowa**: Rozszerz `UserService` lub dodaj nowy moduł w `/services/modules/`
- **Zmiana walidacji**: Edytuj `UserValidator`
- **Modyfikacja schematu**: Aktualizuj `models/User.js`
