What if microservices were just npm packages?

Instead of:
```
fetch('https://api.service.com/shorten')
```

What about:
```javascript
import { URLShortener } from '@longurl/core'
const short = await shortener.create(url)
```

No vendor lock-in. Deploy anywhere. Compose as needed. Monetize individual packages.

Building this with longurl.co - curious if others see value in "microservices as packages" vs traditional SaaS?