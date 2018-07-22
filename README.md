#STOCK MOCK 

##First, let's procrastinate: 

https://www.youtube.com/watch?v=Qujrvw_qHH0

##STOCK MARKET SIMULATION

each player when signed up gets 50.000 $ for start 

###JOIN: 

    - signup an account 

    - log in 

    - make a transaction/ check your stocks 

    - you have 50.000$, trade away !

###ORDER TYPES:

    - MARKET ORDER: trade by bid/ask price.

    - STOP ORDER: set a price and wait untill the market accepts and you get your stocks (or money if selling).

    - LIMIT ORDER: set a price and wait untill the market accepts, then the order becomes market order.

Current Features: 

    - See stocks in database 

    - when clients make order for an odd stock, the system will grab that stock, return false if no stock found. 

    - see your traded stocks. 

Working on :

    - Site security.

    - ajax for automatic refresh (so user can see stock prices update every 60 seconds);

    - stock-bot: a bot that trades stocks (long-term) 


#TECHNICAL

- use alphavantage.co API for stock data 

- run 2 workers: 

  - API worker: read data from mongoDB, query new stock data every 10 minutes. 

	- Stock Analisys worker: check users' transactions to see if the new stock price match the transition price, if so then proceed the transaction. This worker also remove out-dated transactions. 

- 
