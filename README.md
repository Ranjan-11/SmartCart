# 🛒 SmartCart

> 🚀 A full-stack, microservices-based e-commerce platform built with **Java, Spring Boot, Kafka, Redis, MySQL, Docker, and Angular**.

---

## 📌 Overview

**SmartCart** is a scalable e-commerce application designed to demonstrate real-world backend and full-stack development concepts.

The project includes authentication, product management, shopping cart, inventory management, order processing, payment processing, distributed communication, caching, and event-driven Saga workflows.

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │   🅰️ Angular App     │
                         │      Port: 4200      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    🚪 API Gateway    │
                         │      Port: 8080      │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
      │ 🔐 Auth      │       │ 👤 User      │       │ 📦 Product   │
      │ Service      │       │ Service      │       │ Service      │
      │ Port: 8081   │       │ Port: 8082   │       │ Port: 8083   │
      └──────────────┘       └──────────────┘       └──────────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
      │ 🛒 Cart      │       │ 📋 Order     │       │ 💳 Payment   │
      │ Service      │       │ Service      │       │ Service      │
      │ Port: 8084   │       │ Port: 8086   │       │ Port: 8087   │
      └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
             │                      │                      │
             │                      └──────────┬───────────┘
             │                                 │
             │                                 ▼
             │                         ┌──────────────┐
             │                         │ 📨 Apache    │
             │                         │    Kafka     │
             │                         └──────┬───────┘
             │                                │
             │                                ▼
             │                         ┌──────────────┐
             └────────────────────────►│ 📦 Inventory │
                                      │ Service      │
                                      │ Port: 8085   │
                                      └──────────────┘

                         ┌──────────────────────┐
                         │ 🔎 Eureka Server     │
                         │      Port: 8761      │
                         └──────────────────────┘

                         ┌──────────────────────┐
                         │ 🗄️ MySQL             │
                         │ Service Databases    │
                         └──────────────────────┘

                         ┌──────────────────────┐
                         │ ⚡ Redis              │
                         │ Cache + Cart Storage │
                         └──────────────────────┘

🧩 Microservices
Service	Port	Responsibility
🚪 API Gateway	8080	Central entry point and request routing
🔐 Auth Service	8081	Registration, login and JWT authentication
👤 User Service	8082	User profiles and addresses
📦 Product Service	8083	Products, categories, filtering and pagination
🛒 Cart Service	8084	Redis-based shopping cart
📦 Inventory Service	8085	Stock management and reservation
📋 Order Service	8086	Order lifecycle and Saga orchestration
💳 Payment Service	8087	Payment processing and transactions
🔎 Eureka Server	8761	Service discovery
📚 Common Library	—	Shared models, security utilities and events
🛠️ Technology Stack
☕ Backend
Java 17
Spring Boot
Spring Security
Spring Data JPA
Hibernate
REST APIs
Spring Cloud
OpenFeign
🔗 Microservices
Eureka Service Discovery
Spring Cloud API Gateway
Apache Kafka
Event-Driven Architecture
Saga Pattern
Resilience4j
🗄️ Database & Cache
MySQL
Redis
🅰️ Frontend
Angular
TypeScript
HTML
CSS
☁️ DevOps & Infrastructure
Maven
Docker
Jenkins
Kubernetes
AWS
🔐 Authentication & Security

SmartCart uses Spring Security + JWT for authentication and authorization.

Features
👤 User registration
🔑 Login authentication
🔒 BCrypt password hashing
🎫 JWT access tokens
♻️ Refresh tokens
👮 Role-based authorization
🛡️ Gateway-level JWT validation
🔄 User identity propagation between services
🔄 Saga Order Processing

SmartCart uses an event-driven Saga workflow for distributed order processing.

✅ Successful Order Flow
👤 Customer
     │
     ▼
🚪 API Gateway
     │
     ▼
📋 Order Service
     │
     │ OrderCreatedEvent
     ▼
📦 Inventory Service
     │
     │ InventoryReservedEvent
     ▼
💳 Payment Service
     │
     │ PaymentSuccessEvent
     ▼
📋 Order Service
     │
     ▼
✅ Order Confirmed
❌ Compensation Flow

If inventory reservation or payment processing fails, compensation events are triggered.

📋 Order Created
       │
       ▼
📦 Inventory Reservation
       │
       ├──── ❌ Failure
       │         │
       │         ▼
       │    ❌ Order Failed
       │
       ▼
💳 Payment Processing
       │
       ├──── ❌ Failure
       │         │
       │         ▼
       │   🔄 Release Inventory
       │         │
       │         ▼
       │   ❌ Order Cancelled
       │
       ▼
✅ Order Completed

This approach helps maintain consistency across multiple microservices without relying on a single distributed database transaction.

📨 Apache Kafka

Kafka is used for asynchronous communication between microservices.

Example Events
📋 Order Created
📦 Inventory Reserved
🔄 Inventory Released
💳 Payment Success
❌ Payment Failed
🚫 Order Cancelled

Kafka helps decouple services and enables event-driven communication between order, inventory, and payment workflows.

⚡ Redis

Redis is used for high-performance data access and shopping cart operations.

Use Cases
🚀 Product caching
🛒 Shopping cart storage
⚡ Fast data retrieval
⏱️ Cart expiration
📉 Reducing repeated database queries
🚪 API Gateway

The API Gateway acts as the single entry point for frontend requests.

Responsibilities
🔀 Request routing
🛡️ JWT validation
🔐 Authentication filtering
👤 User header propagation
🔗 Communication with downstream microservices
🔎 Eureka Service Discovery

Eureka provides service registration and discovery.

Each microservice registers with Eureka, allowing services to communicate using logical service names instead of hardcoded service addresses.

Auth Service
     │
     ├──────────────┐
     ▼              │
 Eureka Server ◄────┤ User Service
     ▲              │
     ├──────────────┤ Product Service
     │              │
     ├──────────────┤ Order Service
     │              │
     └──────────────┘
🔗 OpenFeign

OpenFeign is used for synchronous communication between selected microservices.

Example:

🛒 Cart Service
       │
       │ OpenFeign
       ▼
📦 Product Service

This allows the Cart Service to validate product information before adding items to the cart.

🗄️ Database Architecture

Each microservice follows a separate database/schema approach to maintain service ownership.

                    🗄️ MySQL
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    auth_db         user_db       product_db
        │              │              │
        ▼              ▼              ▼
     cart_db       order_db      inventory_db
        │
        ▼
    payment_db
📁 Project Structure
SmartCart/
│
├── 🚪 api-gateway/
├── 🔐 auth-service/
├── 🛒 cart-service/
├── 📚 common-library/
├── 🐳 docker/
├── 🔎 eureka-server/
├── 📦 inventory-service/
├── 📋 order-service/
├── 💳 payment-service/
├── 📦 product-service/
├── 🅰️ smartcart-frontend/
├── 👤 user-service/
│
├── 📄 pom.xml
└── 📖 README.md
🅰️ Frontend Structure

The Angular application follows a modular architecture.

smartcart-frontend/
│
├── src/
│   │
│   ├── app/
│   │   │
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── models/
│   │   │   └── services/
│   │   │
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── home/
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   └── products/
│   │   │
│   │   ├── layout/
│   │   │
│   │   └── shared/
│   │
│   └── environments/
│
├── package.json
├── angular.json
└── tsconfig.json
🐳 Running the Project
📋 Prerequisites

Install:

☕ Java 17+
🏗️ Maven
🟢 Node.js
🅰️ Angular CLI
🐳 Docker Desktop
🗄️ MySQL
⚡ Redis
📨 Apache Kafka
📥 Clone the Repository
git clone https://github.com/Ranjan-11/SmartCart.git
cd SmartCart
🏗️ Build Backend

From the project root:

mvn clean install
🐳 Start Infrastructure

Use the Docker configuration provided in the docker directory.

docker compose -f docker/docker-compose.infra.yml up -d
▶️ Start Services

Recommended startup order:

1️⃣ Eureka Server
2️⃣ API Gateway
3️⃣ Auth Service
4️⃣ User Service
5️⃣ Product Service
6️⃣ Cart Service
7️⃣ Inventory Service
8️⃣ Order Service
9️⃣ Payment Service
🅰️ Start Angular Frontend
cd smartcart-frontend
npm install
ng serve

Frontend:

http://localhost:4200

API Gateway:

http://localhost:8080

Eureka Server:

http://localhost:8761
🧪 Testing
Backend

Run from the project root:

mvn test
Frontend
cd smartcart-frontend
npm test
📌 Key Features
🏗️ Microservices Architecture
🌐 REST API Development
🔎 Service Discovery
🚪 API Gateway
🔐 JWT Authentication
♻️ Refresh Token Management
👮 Role-Based Access Control
📨 Kafka Messaging
🔄 Event-Driven Architecture
🔗 Saga Pattern
📦 Inventory Reservation
💳 Payment Workflow
🔄 Compensation Handling
⚡ Redis Caching
🛒 Redis Shopping Cart
🗄️ MySQL
🧩 JPA/Hibernate
🔗 OpenFeign
🐳 Docker
🅰️ Angular
📘 TypeScript
🧠 Design Patterns & Concepts

The project demonstrates:

🏗️ Microservices Architecture
🔄 Saga Pattern
📨 Event-Driven Architecture
🔎 Service Discovery
🚪 API Gateway Pattern
📦 Repository Pattern
🔄 DTO Pattern
⚠️ Centralized Exception Handling
🔐 JWT Authentication
🔗 Distributed Service Communication
⚡ Caching
📨 Asynchronous Messaging
🔐 Security Note

Sensitive configuration values such as database passwords, JWT secrets, API keys, and cloud credentials should be provided through environment variables or external configuration.

Example:

spring:
  datasource:
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

⚠️ Never commit real credentials or secrets to the repository.

🚀 Future Improvements

Potential future improvements include:

🔄 Automated CI/CD pipeline
☸️ Production Kubernetes deployment
🔍 Distributed tracing
📊 Centralized logging
📈 Prometheus and Grafana monitoring
🔎 Elasticsearch-based search
☁️ Cloud-native deployment
🧪 Automated integration testing
📚 OpenAPI / Swagger documentation


👨‍💻 Author
Ranjan Kumar Singh
Java Backend / Full Stack Developer

🔗 GitHub:
https://github.com/Ranjan-11
