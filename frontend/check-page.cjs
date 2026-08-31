const http = require('http');
http.get('http://localhost:5173/', res => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    const scripts = [...b.matchAll(/<script[^>]+src="([^"]+)"/g)].length;
    console.log('Scripts:', scripts);
    console.log('Root mount:', b.includes('id="root"'));
    console.log('Title:', b.includes('VitaNexa'));
    console.log('Page size:', b.length, 'bytes');
  });
});
