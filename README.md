\# SmartCart 🛒



A full-stack e-commerce platform built using Java, Spring Boot, Microservices, Kafka, Redis, MySQL, Docker, and Angular.



\## 🚀 Overview



SmartCart is a microservices-based e-commerce application designed to demonstrate real-world backend development, distributed communication, authentication, caching, event-driven processing, and Saga-based order processing.



\## 🏗️ Architecture



The application contains the following services:



| Service | Responsibility |

|---|---|

| API Gateway | Central entry point and request routing |

| Eureka Server | Service discovery |

| Auth Service | User registration, login, JWT authentication |

| User Service | User profile and address management |

| Product Service | Product and category management |

| Cart Service | Redis-based shopping cart |

| Inventory Service | Stock management and reservation |

| Order Service | Order management and Saga orchestration |

| Payment Service | Payment processing |

| Common Library | Shared models, security utilities and events |

| Angular Frontend | Customer and admin application |



\## 🛠️ Technology Stack



\### Backend



\- Java

\- Spring Boot

\- Spring Security

\- Spring Data JPA

\- Hibernate

\- REST APIs

\- Spring Cloud

\- OpenFeign



\### Microservices



\- Eureka Service Discovery

\- API Gateway

\- Apache Kafka

\- Saga Pattern

\- Event-Driven Architecture



\### Database \& Cache



\- MySQL

\- Redis



\### Frontend



\- Angular

\- TypeScript

\- HTML

\- CSS



\### DevOps



\- Maven

\- Docker

\- Jenkins

\- Kubernetes

\- AWS



\## 🔐 Authentication



SmartCart uses Spring Security and JWT-based authentication.



Features include:



\- User registration

\- Login authentication

\- BCrypt password hashing

\- JWT access tokens

\- Refresh tokens

\- Role-based authorization

\- Gateway-level JWT validation



\## 🔄 Order Processing



SmartCart uses an event-driven Saga workflow for distributed order processing.



```text

Customer

&#x20;  |

&#x20;  v

API Gateway

&#x20;  |

&#x20;  v

Order Service

&#x20;  |

&#x20;  | OrderCreated

&#x20;  v

Inventory Service

&#x20;  |

&#x20;  | InventoryReserved

&#x20;  v

Payment Service

&#x20;  |

&#x20;  | PaymentSuccess

&#x20;  v

Order Service

&#x20;  |

&#x20;  v

Order Confirmed

