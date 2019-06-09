# Account Management API

## Sing Up to Get Authentication Code

### Usage

```
POST /signup
{
    "email": "you@domain.com",
    "password": "your_password",
    "channel": "@your_slack_id (option)"
}

HTTP/1.1 201 Created
{
    "expiresAt": "2019-01-01T23:59:59.000Z",
    "media": "slack",
    "message": "authentication code has been sent",
    "sendTo": "@your_slack_id"
}
```

## Verify Authentication Code

```
POST /verify
{
    "email": "you@domain.com",
    "token": "123456"
}

HTTP/1.1 201 Created
{
    "created": "2019-01-01T00:00:00.000Z",
    "email": "you@domain.com",
    "id": "5cfb82f753d46fc70c5a0f21",
    "message": "verified",
    "username": "you@domain.com"
}
```

## Sign In API

```
POST /signin
{
    "username": "you@domain.com",
    "password": "your_password"
}

HTTP/1.1 201 Created
{
    "created": "2019-01-01T00:00:00.000Z",
    "email": "you@domain.com",
    "id": "5cfb82f753d46fc70c5a0f21",
    "message": "verified",
    "username": "you@domain.com"
}
```

## Get Account API

```
GET /accounts/:username

HTTP/1.1 200 OK
{
    "created": "2019-01-01T00:00:00.000Z",
    "email": "you@domain.com",
    "id": "5cfb82f753d46fc70c5a0f21",
    "username": "you@domain.com"
}
```

## List Payment Methods API

```
GET /accounts/:username/paymentmethods

HTTP/1.1 200 OK
{
    "paymentMethods": [
        {
            "detail": {
                "accountName": "your_name",
                "accountNumber": "1234567",
                "accountType": "0",
                "bankCode": "0001",
                "branchCode": "123",
                "validFrom": "2019-07-01"
            },
            "isDefault": false,
            "status": "verified",
            "type": "directDebit"
        }
    ]
}
```

## Add Payment Method API

```
POST /accounts/:username/paymentmethods
{
    "detail": {
        "brand": "VISA",
        "cardHolderName": "your_name",
        "cardNumber": "4980100010001234",
        "expMonth": "03",
        "expYear": "2020"
    },
    "isDefault": false,
    "status": "verified",
    "type": "creditCard"
}

HTTP/1.1 201 Created
{
    "paymentMethods": [
        {
            "detail": {
                "accountName": "your_name",
                "accountNumber": "1234567",
                "accountType": "0",
                "bankCode": "0001",
                "branchCode": "123",
                "validFrom": "2019-07-01"
            },
            "isDefault": false,
            "status": "verified",
            "type": "directDebit"
        },
        {
            "detail": {
                "brand": "VISA",
                "cardHolderName": "your_name",
                "cardNumber": "4980100010001234",
                "expMonth": "03",
                "expYear": "2020"
            },
            "isDefault": false,
            "status": "verified",
            "type": "creditCard"
        }
    ]
}
```

## Health Check API
```
GET /

HTTP/1.1 200 OK
{
    "app": "Account Management API",
    "version": "0.0.1"
}
```

## Environment Variables

```
export SG_API_KEY="YOUR_SENDGRID_API_KEY"
export WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL"
export MONGO_DB_HOST="YOUR_MONGO_DB_HOST"
export MONGO_DB_USER="YOUR_MONGO_DB_USER"
export MONGO_DB_PASS="YOUR_MONGO_DB_PASS"
```

```
now secret add sg-api-key "YOUR_SENDGRID_API_KEY"
now secret add webhook-url "YOUR_SLACK_WEBHOOK_URL"
now secret add mongo-db-host "YOUR_MONGO_DB_HOST"
now secret add mongo-db-user "YOUR_MONGO_DB_USER"
now secret add mongo-db-pass "YOUR_MONGO_DB_PASS"
```
