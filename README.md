# STOCK MOCK 

## First, let's procrastinate: 

https://www.youtube.com/watch?v=Qujrvw_qHH0

## STOCK MARKET SIMULATION

each player when signed up gets 50.000 $ for start 

### JOIN: 

    - signup an account 

    - log in 

    - make a transaction/ check your stocks 

    - you have 50.000$, trade away !

### ORDER TYPES:

    - MARKET ORDER: trade by bid/ask price.

    - STOP ORDER: set a price and wait untill the market accepts and you get your stocks (or money if selling).

    - LIMIT ORDER: set a price and wait untill the market accepts, then the order becomes market order.

### Current Features: 

    - See stocks in database 

    - Add order to buy/sell stocks
    
    - Check what stock/assets you are having.
    
    - Check what transactions are pending ( stop order or limit order ). Which means they are being processed by a cron job I set up, which will process or decline the transaction if the price is met/expired.
    
    - When pending transactions go through ( accepted or declined ), you will receive/lose money/stocks.

    - when clients make order for an odd stock, the system will grab that stock, return false if no stock found. 

### Working on :

    - Site security.

    - ajax for automatic refresh (so user can see stock prices update every 60 seconds);

    - stock-bot: a bot that trades stocks (long-term) 


# TECHNICAL SPECS

- use alphavantage.co API for stock data 

- run 2 workers (cron jobs):

  - API worker: read data from mongoDB, query new stock data every 10 minutes from alphavantage.co

  - Stock Analisys worker: check users' transactions to see if the new stock price match the transition price, if so then proceed the transaction. This worker also remove out-dated transactions. 
