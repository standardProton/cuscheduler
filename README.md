
CU SCHEDULER

This is a project that significantly improves the scheduling experience for CU students. It lets you build a schedule around which hours work best for your schedule, and also lets you avoid waitlisted classes. It is important to clarify that this project is not affiliated with the University of Colorado, this is a personal project that accesses the class API. 


You can see the deployed project at www.cuscheduler.com


This project uses Integer Linear Programming (ILP) under the hood to optimize the placement of classes by minimizing a cost function. It factors in some probability into the cost function to create multiple variations of a schedule (there are more sophisticated ways than using probability, I may implement something more advanced in the future).