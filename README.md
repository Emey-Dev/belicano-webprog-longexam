# Belicano Web Programming - Long Exam 1
Mark Antonio A. Belicano
INF234-MWA

This project has 2 parts:

- `belicano-client` - frontend built with React and Vite
- `belicano-server` - backend built with Node.js and Express

It is a small e-commerce app for BulldogEx. The frontend shows the pages, and the backend handles products, users, cart, orders, reviews, and suppliers.

## How to run the project

### 1. Install dependencies

Open 2 terminals.

First terminal:

```bash
cd belicano-client
npm install
```

Second terminal:

```bash
cd belicano-server
npm install
```

### 2. Create the server environment file

Inside `belicano-server`, create a `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bdexchange_db
JWT_SECRET=your_secret_key_here
SALT=10
```

Make sure your MongoDB is running before starting the server.

### 3. Start the app

Frontend:

```bash
cd belicano-client
npm run dev
```

Backend:

```bash
cd belicano-server
npm run dev
```

You can also start the server with:

```bash
cd belicano-server
npm start
```

## Main frontend routes

- `/` - Home page
- `/about` - About page
- `/products` - Product list
- `/products/:name` - Product details
- `/cart` - Cart page
- `/orders` - Orders page
- `/admin` - Admin page
- `/supplier` - Supplier page
- `/auth/signin` - Sign in
- `/auth/signup` - Sign up

## Main backend API

The server already has API routes for the app:

- `/api/products`
- `/api/cart`
- `/api/order`
- `/api/review`
- `/api/user`
- `/api/category`
- `/api/supplier`
- `/api/stats`

This project is not just a static frontend. The backend is already connected and working with MongoDB.

## Client and server integration

The frontend and backend work together as a full web application. The client is the part that users see and interact with. The server is the part that handles data, validation, and logic.

For example po, when the user opens the product page, the React app requests data from the backend. The backend receives the request, gets the needed product information from MongoDB, and sends it back as JSON. The frontend then renders that data into the page.

The same process is used for users, orders, reviews, and suppliers. The client is responsible for showing the interface and sending requests. The server is responsible for checking the data and returning the correct response.

This type of integration makes the app more useful than a simple static website because real data can be saved, updated, and retrieved from the database.

## Libraries and packages used

### Client-side libraries

- `React` - used to build the user interface and reusable components
- `React DOM` - connects React to the browser
- `React Router DOM` - handles routing between pages like home, about, products, and auth pages
- `Vite` - used as the frontend development server and build tool
- `Tailwind CSS` - used for styling the UI
- `@tailwindcss/vite` - connects Tailwind to Vite
- `ESLint` - checks the code for possible errors and code quality issues

### Server-side libraries

- `Express` - creates the API routes and handles HTTP requests
- `MongoDB / Mongoose` - connects the app to MongoDB and defines the database models
- `Cors` - allows communication between frontend and backend when they run on different ports
- `dotenv` - loads environment variables from the `.env` file
- `jsonwebtoken` - used for authentication tokens
- `bcryptjs` - used for hashing and checking passwords
- `nodemon` - helps restart the server automatically during development

These packages are important because they support the app’s frontend, backend, database connection, and authentication flow.

## Design patterns used

### Client-side design pattern

The frontend follows a component-based design pattern. The interface is split into smaller reusable components such as `NavBar`, `Footer`, `Button`, `ProductCard`, and `ProductList`.

This makes the code easier to maintain because each component handles a specific part of the UI. The app also uses a layout and page structure, where `Layout.jsx` and `AuthLayout.jsx` provide the shared structure, while the page files handle the content for each route.

### Server-side design pattern

The backend follows a simple MVC-like structure, often called the Route-Controller-Model pattern.

- `routes/` handles the URL and HTTP method
- `controllers/` handles the request logic and sends responses
- `models/` defines how the data is structured in MongoDB
- `middleware/` handles tasks like authentication and validation
- `config/` contains environment and database configuration

This pattern keeps the server organized. The routes do not do all the logic by themselves, and the models do not directly manage requests. Instead, each part has a specific job.

## Project file outline

```text
belicano-webprog-longexam/
├── README.md
├── .gitignore
├── belicano-client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── App.jsx                 # route setup and page navigation
│       ├── main.jsx                # starts the React app
│       ├── assets/
│       │   ├── product-content.js
│       │   ├── img/
│       │   └── styles/
│       ├── components/             # reusable UI parts
│       │   ├── Button.jsx
│       │   ├── Footer.jsx
│       │   ├── NavBar.jsx
│       │   ├── ProductCard.jsx
│       │   └── ProductList.jsx
│       ├── context/                # app state and auth context
│       ├── layouts/                # shared page layouts
│       │   ├── Layout.jsx
│       │   └── AuthLayout.jsx
│       ├── pages/                  # route pages
│       │   ├── AuthPages/
│       │   ├── LandingPages/
│       │   ├── CartPage/
│       │   ├── OrderPage/
│       │   ├── UsersPage/
│       │   └── NotFoundPage.jsx
│       └── utils/
├── belicano-server/
│   ├── package.json
│   ├── server.js                 # starts the Express server
│   ├── .env                      # private environment variables
│   ├── config/                   # database and app configuration
│   ├── controllers/              # request logic
│   ├── middleware/               # validation and auth checks
│   ├── models/                   # MongoDB schemas/models
│   ├── routes/                   # API endpoints
│   └── ...
└── node_modules/
```

This structure shows how the project is organized. The frontend handles the user interface, while the backend handles logic, database access, and API responses. The combination of both parts makes the full web application work properly.

