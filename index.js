addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  //get the ip address of the request
  const ip = request.headers.get('cf-connecting-ip');
  return new Response(`${ip}`, {
    headers: { 'content-type': 'text/plain' },
  })
}
