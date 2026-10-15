# AI-Powered Fraud Detection System

A web-based fraud-risk detection prototype that evaluates financial transactions, identifies potentially suspicious activity using rule-based logic, and stores transaction records in a PostgreSQL database.

## 1. Project Overview

Financial fraud is a major concern in digital transactions. Manually reviewing every transaction can be time-consuming and inefficient.

The **Fraud Detection System** provides a web interface for submitting transaction details and evaluating their potential risk. The backend processes the submitted information, assigns a risk status, and saves valid transactions in a PostgreSQL database.

## 2. Problem Statement

The objective of this project is to develop a web-based application that evaluates financial transactions and helps identify potentially risky activity through predefined rules.

The system demonstrates how Java-based backend processing, database integration, and a modern web frontend can work together in a financial-risk detection application.

## 3. Objectives

- Accept transaction details through a web interface.
- Evaluate transaction amounts and location information.
- Classify transactions into risk categories.
- Store transaction details and risk results in PostgreSQL.
- Demonstrate integration between a React frontend and a Java backend.
- Provide a foundation for future improvements using machine learning.

## 4. Technologies Used

| Technology | Purpose |
|---|---|
| Java 17 | Backend programming |
| Spring Boot | Backend application and REST API |
| Spring Web MVC | HTTP request handling and API endpoints |
| JDBC / JdbcTemplate | Database operations |
| PostgreSQL | Persistent transaction storage |
| React | Frontend user interface |
| Vite | Frontend development server |
| Three.js / React Three Fiber | Interactive 3D visual elements |
| Maven | Backend dependency management and build |

## 5. System Architecture

The application follows a frontend–backend–database architecture.

1. **Frontend:** Collects transaction information from the user.
2. **REST API:** Sends transaction details to the Spring Boot backend.
3. **Service layer:** Evaluates the transaction using predefined rules.
4. **Repository layer:** Uses JDBC to save the transaction and its risk status.
5. **PostgreSQL database:** Stores transaction records for later inspection.

## 6. Fraud Detection Logic

The current prototype uses rule-based risk classification.

| Condition | Result |
|---|---|
| Transaction amount is zero or negative | `INVALID` |
| Transaction amount is ₹1,00,000 or higher | `HIGH RISK` |
| Amount is below ₹1,00,000 and location is missing | `REVIEW` |
| Amount is below ₹1,00,000 and location is provided | `LOW RISK` |

The rules are evaluated by the Java service layer. Invalid transactions are rejected, while transactions receiving a risk classification are saved in the database.

**Note:** The current implementation uses predefined rules rather than a trained machine-learning model. The project can be extended with a trained model and additional fraud indicators in the future.

## 7. Database Design

The application uses PostgreSQL to maintain transaction records.

**Database:** `fraud_detection`

**Table:** `transactions`

| Column | Description |
|---|---|
| `id` | Transaction record identifier |
| `amount` | Transaction amount |
| `sender` | Sender account or identifier |
| `receiver` | Receiver account or identifier |
| `location` | Transaction location |
| `fraud_status` | Calculated risk status |
| `created_at` | Transaction record timestamp |

The repository uses Spring's `JdbcTemplate` to execute parameterized SQL insert statements.

## 8. API Endpoints

### Health Check

- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Purpose:** Checks whether the backend is running.

Example:

```bash
curl http://localhost:8080/api/health
```

### Check Transaction

- **Method:** `POST`
- **Endpoint:** `/api/fraud/check`
- **Content-Type:** `application/json`
- **Purpose:** Evaluates a transaction and returns its risk status.

Example request:

```json
{
  "amount": 150000,
  "sender": "Account-A",
  "receiver": "Account-B",
  "location": "Delhi"
}
```

Example response:

```text
HIGH RISK
```

The example demonstrates the amount-based rule in the current implementation.

## 9. Prerequisites

Install the following before running the application:

- Java Development Kit (JDK) 17
- Node.js and npm
- PostgreSQL
- Git

The backend includes a Maven wrapper, so Maven can be run through `./mvnw` on Linux or macOS, or `mvnw.cmd` on Windows.

## 10. Installation and Setup

### Step 1: Clone the repository

```bash
git clone https://github.com/rajat270369/AI-fraud-detection-system
cd fraud-detection-system
```

Replace the placeholder with your actual GitHub repository URL.

### Step 2: Configure PostgreSQL

Create a database named:

```sql
CREATE DATABASE fraud_detection;
```

Create the `transactions` table if it does not already exist:

```sql
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    amount NUMERIC,
    sender VARCHAR(255),
    receiver VARCHAR(255),
    location VARCHAR(255),
    fraud_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

If the table already exists, do not recreate it.

### Step 3: Configure the backend

Open `backend/src/main/resources/application.properties`.

Configure the database URL, username, and password for your local PostgreSQL installation. Keep credentials private and do not commit real passwords to GitHub.

The database URL should point to the `fraud_detection` database:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/fraud_detection
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver
```

Set `DB_USERNAME` and `DB_PASSWORD` in your environment before starting the backend, or use your existing local configuration without committing credentials.

### Step 4: Start the backend

Open a terminal in the `backend` folder:

```bash
./mvnw spring-boot:run
```

On Windows Command Prompt, use:

```bat
mvnw.cmd spring-boot:run
```

The backend should start on port `8080`.

### Step 5: Start the frontend

Open another terminal in the `frontend` folder:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite, typically:

```text
http://localhost:5173
```

Keep both the backend and frontend running while testing. If Vite selects another port, ensure the backend's CORS configuration allows that frontend origin.

## 11. Testing

Test the health endpoint:

```bash
curl http://localhost:8080/api/health
```

Test a high-risk transaction:

```bash
curl -X POST http://localhost:8080/api/fraud/check \
  -H "Content-Type: application/json" \
  -d '{"amount":150000,"sender":"Account-A","receiver":"Account-B","location":"Delhi"}'
```

Expected result:

```text
HIGH RISK
```

After a valid transaction is submitted, verify that it has been saved in PostgreSQL:

```sql
SELECT * FROM transactions ORDER BY id DESC;
```

You can also test the application through the frontend by opening the command center, entering transaction details, and submitting the transaction for analysis.

## 12. Java Concepts Demonstrated

- Object-oriented programming through Java classes and objects.
- Encapsulation through private fields and getters/setters.
- Dependency injection through Spring Boot.
- Separation of concerns using controller, service, model, and repository layers.
- REST API development and JSON request handling.
- Exception and HTTP response handling through Spring's response entities.
- Database access using JDBC and `JdbcTemplate`.

## 13. Future Enhancements

- Integrate a trained machine-learning model for fraud prediction.
- Add more fraud indicators, including transaction frequency and unusual account activity.
- Implement authentication and role-based access.
- Add transaction history, search, filtering, and reporting.
- Introduce automated tests for fraud classification and database operations.
- Add configurable risk thresholds and an administrative dashboard.

## 14. Conclusion

The Fraud Detection System demonstrates a Java-based web application that accepts transaction details, evaluates risk using predefined rules, and stores transaction records in PostgreSQL. It brings together frontend development, REST API integration, Java service logic, and JDBC-based persistence in one application.

The project provides a practical starting point for developing more advanced fraud detection capabilities.

## 15. Academic Project Information

**Project:** AI-Powered Fraud Detection System  
**Category:** Java Web-Based Application  
**Backend:** Java and Spring Boot  
**Frontend:** React and Vite  
**Database:** PostgreSQL  

Add your team members, guide's name, institution, and academic year here if required by your submission format.
