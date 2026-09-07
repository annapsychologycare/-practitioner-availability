const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { fileBase64, fileType } = JSON.parse(event.body);
    if (!fileBase64 || !fileType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fileBase64 or fileType' }) };
    }

    const buffer = Buffer.from(fileBase64, 'base64');

    if (fileType === 'pdf') {
      const data = await pdfParse(buffer);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: data.text }),
      };
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: result.value }),
      };
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Unsupported file type' }) };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Extraction failed' }),
    };
  }
};
