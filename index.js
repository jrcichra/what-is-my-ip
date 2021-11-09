addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

//getIsp
async function getISP(ip) {
  //check if the ip is in the cache
  const cache = await readCache(ip)
  //if the ip is in the cache return the cache
  if (cache) {
    console.log(`Cache hit on ${ip}`)
    cache.cached = true
    return cache
  }
  console.log(`Cache miss on ${ip}`)
  // else hit the api and cache it
  const response = await fetch(`http://ip-api.com/json/${ip}`)
  const data = await response.json()
  await writeCache(ip, data)
  data.cached = false
  return data
}

//store in cache
async function writeCache(ip, value) {
  //make sure value is valid json
  if (typeof value === 'object') {
    await what_is_my_ip.put(ip, JSON.stringify(value), { expirationTtl: 60 * 60 * 24 })
  } else {
    throw new Error('Value must be an object')
  }
}

//read the cache
async function readCache(ip) {
  return JSON.parse(await what_is_my_ip.get(ip))
}

async function handleRequest(request) {
  //get the ip address of the request
  const ip = request.headers.get('cf-connecting-ip');
  //json
  if (request.url.includes('/json')) {
    const data = await getISP(ip)
    return new Response(`${JSON.stringify(data)}\n`, {
      headers: { 'content-type': 'application/json' },
    })
  }
  //both ip and isp
  if (request.url.includes('/ip_and_isp')) {
    const data = await getISP(ip)
    return new Response(`${ip} - ${data.isp}\n`, {
      headers: { 'content-type': 'text/plain' },
    })
  }
  //if the url is /ip return the ip address
  else if (request.url.includes('/ip')) {
    return new Response(`${ip}\n`, {
      headers: { 'content-type': 'text/plain' },
    })
  }
  //if the url is /isp return the isp
  else if (request.url.includes('/isp')) {
    const data = await getISP(ip)
    return new Response(`${data.isp}\n`, {
      headers: { 'content-type': 'text/plain' },
    })
  }
  //if favicon return svg
  else if (request.url.includes('/favicon.ico')) {
    return new Response(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm0 29C8.929 29 3 23.071 3 16S8.929 3 16 3s13 4.929 13 13-4.929 13-13 13zm-1.5-9.5v-5h-1v5h-5v1h5v5h1v-5h5v-1h-5z"/></svg>`, {
      headers: { 'content-type': 'image/svg+xml' },
    })
  }
  // if base path return the ip and isp in html form
  else if (request.url.includes('/')) {
    const data = await getISP(ip)
    return new Response(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${ip} - ${data.isp}</title>
    </head>
    <body>
      <h1>${ip}</h1>
      <h2>${data.isp}</h2>
      <p>Data from API (Cache ${data.cached ? "Hit" : "Miss"})</p>
      <pre>${JSON.stringify(data, null, 1)}</pre>
      <p>Other routes (text/plain):</p>
      <ul>
        <li><a href="/ip">/ip</a></li>
        <li><a href="/isp">/isp</a></li>
        <li><a href="/json">/json</a></li>
        <li><a href="/ip_and_isp">/ip_and_isp</a></li>
      </ul>
    </body>
    </html>`, {
      headers: { 'content-type': 'text/html' },
    })
  }
}
