const https = require('https');

exports.handler = async function(event) {
  const API_KEY = process.env.FRED_API_KEY;
  const params  = new URLSearchParams(event.queryStringParameters);
  params.set('api_key', API_KEY);
  params.set('file_type', 'json');

  const fredUrl = 'https://api.stlouisfed.org/fred/series/observations?' + params.toString();

  try {
    const data = await new Promise((resolve, reject) => {
      https.get(fredUrl, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
        res.on('error', reject);
      }).on('error', reject);
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: data
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
