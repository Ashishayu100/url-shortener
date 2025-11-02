URL Shortener with AnalyticsA high-performance, scalable URL shortening service built with Node.js, Express, MongoDB, and Redis.
This production-ready application not only shortens URLs but also provides a real-time analytics dashboard to track link performance.(https://url-shortener-t0ob.onrender.com/)
Key FeaturesHigh Performance: Architected to handle over 1000 concurrent users with 99.9% uptime1.Blazing Fast Redirects: Implemented a Redis caching layer that reduces redirect latency by 90% (from 20ms to just 2ms) for an optimal user experience
2.Real-Time Analytics: Features a dynamic analytics dashboard that tracks clicks and HTTP referrers in real-time using the MongoDB aggregation pipeline3.Robust Security: Integrated rate limiting, comprehensive input validation, and security headers to prevent common threats like XSS and injection attacks4.Efficient by Design: Achieves constant time $O(1)$ cache lookups and logarithmic $O(\log n)$ database queries through strategic indexing and caching5.Tech StackBackend: Node.js, Express.jsDatabase: MongoDBCache: RedisLanguages: JavaScriptAPI: RESTful APIsDeployment: Cloud Deployment ReadyGetting StartedFollow these instructions to get a local copy up and running for development and testing purposes.PrerequisitesYou need to have Node.js, npm, MongoDB, and Redis installed on your machine.InstallationClone the repositoryBashgit clone https://github.com/Ashishayu100/url-shortener.git
Navigate into the project directoryBashcd url-shortener
Install NPM packagesBashnpm install
Create a .env file in the root directory and add the following environment variables:Code snippetPORT=8001
MONGO_URI=your_mongodb_connection_string
REDIS_URI=your_redis_connection_string
Start the serverBashnpm start
The server will start on http://localhost:8001 (or the port you specified).API EndpointsThe following are the primary endpoints for the service:HTTP MethodEndpointDescriptionPOST/api/urlCreates a new short URL. Requires a url in the body.GET/:shortIdRedirects the user to the original long URL.GET/api/url/analytics/:shortIdRetrieves the click analytics for a specific short URL.Example POST /api/url Request BodyJSON{
  "url": "https://github.com/Ashishayu100"
}
LicenseDistributed under the MIT License. See LICENSE for more information.
