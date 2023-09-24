
CU SCHEDULER
This is a project that I am currently developing to improve the scheduling experience for CU students. It lets you build a schedule around which hours work best for your schedule, and also lets you avoid waitlisted classes. It is important to clarify that this project is not affiliated with the University of Colorado, this is a personal project that accesses the class API. 

This project is not fully deployed yet, so there is no domain to see it, but you can use
```npm run dev```
to see the progress. Note that a proxy is needed to adapt to the CORS policy.

This project uses Integer Linear Programming under the hood to optimize the placement of classes by minimizing a cost function (the unavailable times). It factors in some probability into the cost function to create multiple variations of a schedule (there are more sophisticated ways than using probability, I may implement something more advanced in the future).