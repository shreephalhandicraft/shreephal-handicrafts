phonepe-payment-service/
├── src/
│   ├── controllers/
│   │   ├── paymentController.js
│   │   ├── orderController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── cors.js
│   ├── routes/
│   │   ├── payment.js
│   │   ├── orders.js
│   │   ├── upload.js
│   │   └── health.js
│   ├── services/
│   │   ├── phonepeService.js
│   │   ├── orderService.js
│   │   ├── paymentService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── crypto.js
│   │   ├── logger.js
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── validators.js
│   ├── config/
│   │   ├── database.js
│   │   ├── environment.js
│   │   ├── phonepe.js
│   │   └── redis.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   └── User.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api.md
│   └── deployment.md
├── scripts/
│   ├── migrate.js
│   └── seed.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── server.js
└── README.md
