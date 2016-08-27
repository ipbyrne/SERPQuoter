var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var methodOverride = require('method-override');
var shortid = require('shortid');

// SEMRUSH API
var SEMRushAPI = require('node-semrush');
var semrush = new SEMRushAPI('e8eb2a6267f029ba9eacab90df4f6878');

// STRIPE PAYMENT
var stripe = require('stripe')('sk_test_EiIApoM38WkUtgzBlAjIv8tw');

var port = process.env.PORT || 8080;

var options = {
  server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } },
  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
mongoose.connect('mongodb://ipbyrne:n4g4pl0x@ds017736.mlab.com:17736/serpsolutionquote', options);

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(methodOverride());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// CORS
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// define model =================
var Entry = mongoose.model('Entry', {
  domainReport: Object,
  keywordQuote: Array,
  sessionID: String,
  paid: Boolean
});

// Listen
app.listen(port, function() {
  console.log("Listening on http://localhost:" + port);
})

// REST API
// GENERATE REPORT AND QUOTE
app.get('/api/test?', function(req, res) {
  console.log('Pinged!');
  // Set URL
  var url = req.query.url;

  // Set Keywords
  var keywords = req.query.keywords.split(',');

  // Call SEMRUSH API and get website audit data
  var domainRankReport;
  var keywordResponse;
  var phraseOrganicReport;

  semrush.domain_rank(url, {}, function(err, response) {
    if (err) {
      domainRankReport =  "No Data";
    } else {
      // See http://www.semrush.com/api.html for format of returned object
      domainRankReport = response;
    }
  });

  // Go through each keywords in array and get CPC and SV
  var newKeywordArray = [];

  keywords.forEach(function(keyword) {
    // Call SEMRUSH to get CPC and Search Volume
    var newKeyword = {
      keyword: keyword,
      searchVolume: '',
      costPerClick: '',
      currentPosition: '',
      expectedTraffic: '',
      teir1Price: '',
      teir2Price: '',
      teir3Price: '',
      teir4Price: '',
      teir5Price: 'Free'
    };
    semrush.phrase_this(keyword, {}, function(err, response) {
      if (err) {
        newKeyword.searchVolume = 1000;
        newKeyword.costPerClick = 2.50;
      } else {
        keywordResponse = response;
        newKeyword.searchVolume = keywordResponse[0].Requests;
        if(keywordResponse[0].CPC == 0){
          newKeyword.costPerClick = 2.50;
        } else {
          newKeyword.costPerClick = keywordResponse[0].CPC;
        }

        // Calculate Expected Traffic
        newKeyword.expectedTraffic = newKeyword.searchVolume * 0.20;
        newKeyword.teir1Price = ((newKeyword.costPerClick / 5) * newKeyword.expectedTraffic).toFixed(2);
        newKeyword.teir2Price = (newKeyword.teir1Price * 0.80).toFixed(2);
        newKeyword.teir3Price = (newKeyword.teir2Price * 0.75).toFixed(2);
        newKeyword.teir4Price = (newKeyword.teir3Price * 0.66).toFixed(2);
      }
    });

    // Go Through new keywords array and get current rank of keywords
    semrush.phrase_organic(keyword, {display_limit: 30}, function(err, response) {
      if (err) {
        newKeyword.currentPosition = "Not Ranked";
      } else {
        // See http://www.semrush.com/api.html for format of returned object
        phraseOrganicReport = response;
        var counter = 1;
        var positionSet = false;
        phraseOrganicReport.forEach(function(result) {
          if(result.Domain === url && !positionSet) {
            newKeyword.currentPosition = counter;
            positionSet = true;
          }
          counter += 1;
          if(counter === 31 && newKeyword.currentPosition === '') {
            newKeyword.currentPosition = "Not Ranked";
          }
        });
      }
    });

    newKeywordArray.push(newKeyword);
  });



  // Return Data to Page
  setTimeout(function() {
    var sessionID = shortid.generate();
    // Check Keyword Data
    var response = {
      domainReport: domainRankReport,
      keywordQuote: newKeywordArray,
      sessionID: sessionID,
      paid: false
    }
    Entry.create(response);
    res.json(response);
  }, 3000);

});

// PROCESS PAYMENTS
app.post('/api/process?', function(req, res) {
  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  var stripe = require("stripe")("sk_test_EiIApoM38WkUtgzBlAjIv8tw");

  // Get the credit card details submitted by the form
  var sessionID = req.query.sessionID;
  var token = req.body.stripeToken;
  var email = req.body.stripeEmail;

  var entry = Entry.find({sessionID: sessionID});

  stripe.customers.create({
    source: token,
    email: email,
    description: '6 Month SEO Service',
    metadata: {'quoteID' : sessionID}
  }).then(function(customer) {
    return stripe.charges.create({
      amount: 100, // Amount in cents
      currency: "usd",
      customer: customer.id
    });
  }).then(function(charge) {
    // YOUR CODE: Save the customer ID and other info in a database for later!
  });

  return res.redirect('http://serpsolution.com/thanks');
});
