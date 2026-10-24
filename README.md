# StockWise — Inventory Management System

A web-based inventory management application designed to help users manage products, monitor stock levels, and maintain inventory records efficiently.

## About the Project

StockWise is a full-stack inventory management project that connects a user-friendly interface with a database to support everyday inventory operations.

The project focuses on managing structured data, implementing authentication, and performing database operations through a web application. It also demonstrates how technical solutions can support business processes such as inventory tracking and low-stock monitoring.

## Features

- **User Authentication:** Login using email and password.
- **Dashboard:** View inventory statistics.
- **Product Management:** Add, view, edit, and delete products.
- **Low-Stock Monitoring:** Configure a low-stock threshold to identify products that need attention.
- **Database Integration:** Store and manage inventory data using Supabase.
- **Access Control:** Use database security policies to control data access.
- **Responsive UI:** Clean interface with a colorful light theme.
- **Live Deployment:** Access the application through a deployed website.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Building the user interface |
| JavaScript | Application logic and interactions |
| CSS | Styling and responsive layout |
| Supabase | Authentication and database services |
| PostgreSQL | Relational data storage |
| Git | Version control |
| GitHub | Source code hosting |
| Vercel | Application deployment |

## Key Functionalities

### 1. Authentication
Users can log in using their credentials through Supabase Auth.

### 2. Inventory Management
Users can create, read, update, and delete product records.

These operations are commonly known as CRUD:
- **Create:** Add a new product.
- **Read:** View product details.
- **Update:** Modify existing product information.
- **Delete:** Remove a product record.

### 3. Dashboard
The dashboard presents inventory statistics to help users understand their current stock position.

### 4. Low-Stock Monitoring
Users can configure a stock threshold to identify products whose quantities require attention.

### 5. Database Security
Supabase database policies and Row Level Security (RLS) help control access to inventory data.

## Data Engineering Relevance

This project provides practical exposure to concepts related to data management and database-driven applications.

- Working with structured inventory data.
- Understanding relational databases and PostgreSQL.
- Performing CRUD operations on stored data.
- Connecting a frontend application to a database.
- Understanding authentication and data access controls.
- Using data to support business activities such as stock monitoring and inventory management.

Although StockWise is an inventory management application rather than a dedicated data pipeline, it provides a foundation for understanding how business applications store, manage, and use data.

## Project Workflow

1. A user logs in to the application.
2. The user interacts with the inventory dashboard.
3. Product information is added, viewed, updated, or deleted.
4. The application communicates with Supabase to perform database operations.
5. Inventory statistics and low-stock information help users monitor their products.

## Getting Started

### Prerequisites

Install the following:
- Node.js and npm
- Git
- A Supabase project

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/payalyadav2/stockwise-inventory.git
```

**2. Navigate to the project folder**

```bash
cd stockwise-inventory
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the project root and add your Supabase project credentials using the variable names expected by `src/supabaseClient.js`.

For example, if your application uses these variable names:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

Use the exact names required by your existing code. Never commit your `.env` file or expose a Supabase secret/service-role key in frontend code.

**5. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Deployment

The project is hosted using Vercel, with GitHub serving as the source code repository.

Deployment requires the appropriate Supabase environment variables to be configured in the Vercel project settings.

## Future Enhancements

- Google Sheets integration for importing or exporting inventory data.
- Inventory reports and data visualizations.
- Stock movement history and audit logs.
- CSV import and export.
- Advanced inventory analytics.

These are potential enhancements and are not claimed as implemented features.

## Learning Outcomes

Through this project, I gained practical experience with frontend development, database integration, authentication, CRUD operations, version control, and deployment.

The project also helped me connect technical implementation with business requirements and understand how data-driven applications support operational decision-making.

## Author

**Payal Yadav**

BCA Student | Data Engineering

GitHub: [payalyadav2](https://github.com/payalyadav2)

---

*StockWise — Managing inventory data with a simple, user-friendly web application.*
