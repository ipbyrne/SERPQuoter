var serverResponse;
// Helper Functions
var pingServer = function (url, keywords) {
  // Ping API
  $.getJSON( "https://serpquotertwo.herokuapp.com/api/test?url=" + url + "&keywords=" + keywords, function( data ) {
    // Log Server Response
    var organicKeywords = data.domainReport["0"]["Organic Keywords"];
    var organicTraffic = data.domainReport["0"]["Organic Traffic"];
    var organicTrafficCost = data.domainReport["0"]["Organic Cost"];

    if(organicKeywords && organicTraffic && organicTrafficCost) {
      // Geberate Report
      document.getElementById("organicKeywords").innerHTML = 'Organic Keywords: ' + organicKeywords.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      document.getElementById("organicTraffic").innerHTML = 'Organic Traffic: ' + organicTraffic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      document.getElementById("organicTrafficCost").innerHTML = 'Organic Traffic Cost: $' + organicTrafficCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      document.getElementById("auditTitle").innerHTML = "SEO Audit for " + url;
    }
    // Generate Quote
    data.keywordQuote.forEach(function(keyword) {
      $('#quoteTable tr:last').after('<tr><td  style="text-align:center; width:10%;">' +
      keyword.keyword + '</td><td style="text-align:center; width:10%;">' +
      keyword.searchVolume.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">' +
      keyword.expectedTraffic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">$' +
      keyword.costPerClick + '</td><td  style="text-align:center; min-width:10%;">' +
      keyword.teir5Price + '</td><td  style="text-align:center; min-width:10%;">$' +
      keyword.teir4Price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">$' +
      keyword.teir3Price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">$' +
      keyword.teir2Price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">$' +
      keyword.teir1Price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '</td><td  style="text-align:center; width:10%;">' +
      + keyword.currentPosition + '</td></tr>');
    });
    // Set Form Action with Session ID
    document.getElementById('paymentForm').action = "https://serpquotertwo.herokuapp.com/api/process?sessionID=" + data.sessionID;

    serverResponse = data;
    var element = $('#mainDiv');
    var element2 = $('#loader');

    element.css("display", "block");
    element2.css("display", "none");
  });

  return serverResponse;
};
// AUDIT/QUOTE SUBMIT
$('#test').click(function () {
  var url = $('#url').val();
  var keywords = $('#keywords').val().split(/\n/);

  if(url == '') {
    alert('You must enter a URL');
  }

  if(keywords.length == 0) {
    alert('Please Enter Atleast 1 Keyword');
  }
  if(keywords.length < 11) {
    pingServer(url, keywords);

    var element1 = $('#test');
    var element2 = $('#loader');
    var element3 = $('#firstForm');

    element1.css("display", "none");
    element2.css("display", "block");
    element3.css("display", "none");
  } else {
    alert('5 Keywords Only');
  }
});
