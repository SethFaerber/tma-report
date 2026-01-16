/**
 * Question Mapping Configuration
 *
 * Maps all 82 scoreable questions to their respective drivers and skills.
 * Excel structure: Columns 0-4 are metadata, 5-7 are open-ended questions (skipped),
 * columns 8-89 contain the 82 scoreable Likert scale questions.
 */

const questionMapping = [
  // Purpose (Questions 4-12 in Excel, index 0-8 in our array)
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is clear and understood by our team." },
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is central to everything we do." },
  { driver: "Purpose", skill: "Mission", text: "Our team's mission (purpose) is attracting new team members." },
  { driver: "Purpose", skill: "Values", text: "Our teams know and understand our values." },
  { driver: "Purpose", skill: "Values", text: "Our teams demonstrate and live by our values." },
  { driver: "Purpose", skill: "Values", text: "Our values are creating a culture that attracts new team members." },
  { driver: "Purpose", skill: "Vision", text: "Our vision for the future is clear and documented." },
  { driver: "Purpose", skill: "Vision", text: "Our teams can clearly articulate our vision." },
  { driver: "Purpose", skill: "Vision", text: "We're using our vision as a filter for making strategic decisions." },

  // People (Questions 13-36 in Excel, index 9-32 in our array)
  { driver: "People", skill: "Critical Thinking", text: "Our team members are able to quickly identify and evaluate problems in our business." },
  { driver: "People", skill: "Delegation", text: "Our leaders are skilled at delegating key responsibilities to trustworthy team members." },
  { driver: "People", skill: "Delegation", text: "Effective delegation is enabling our team to move faster." },
  { driver: "People", skill: "Role Clarity", text: "Our team members are clear about their role, responsibilities and accountabilities." },
  { driver: "People", skill: "Role Clarity", text: "Clear roles are enabling our team to collaborate effectively to produce business results." },
  { driver: "People", skill: "Leadership Development", text: "Our leaders are actively spending focused time developing new leaders." },
  { driver: "People", skill: "Leadership Development", text: "New leaders are being promoted to key roles in the organization." },
  { driver: "People", skill: "People Development", text: "Our leaders are actively coaching their team members on a weekly basis." },
  { driver: "People", skill: "People Development", text: "Our team members are growing in hard and soft skills." },
  { driver: "People", skill: "People Development", text: "Our team members are experiencing personal and professional transformation." },
  { driver: "People", skill: "Communication", text: "Communication in our organization is frequent and clear." },
  { driver: "People", skill: "Communication", text: "Healthy communication is resulting in unified collaboration across teams." },
  { driver: "People", skill: "Team Health", text: "Our team members have strong, trusting relationships with each other." },
  { driver: "People", skill: "Team Health", text: "Our team members regularly engage in healthy conflict." },
  { driver: "People", skill: "Team Health", text: "Our team members actively hold each other accountable to commitments." },
  { driver: "People", skill: "Team Health", text: "Our teams are achieving strong results." },
  { driver: "People", skill: "Culture", text: "We have intentionally created a culture we're proud of." },
  { driver: "People", skill: "Culture", text: "Our culture is strengthening our brand and creating a strong reputation." },
  { driver: "People", skill: "Culture", text: "Our culture and reputation are attracting new team members." },

  // Plan (Questions 37-56 in Excel, index 33-52 in our array)
  { driver: "Plan", skill: "Time Management", text: "We manage our time intentionally to protect focus." },
  { driver: "Plan", skill: "Time Management", text: "We are leveraging time and margin to drive our business forward." },
  { driver: "Plan", skill: "Critical Thinking", text: "We are solving problems in a way that is creating opportunities in our business." },
  { driver: "Plan", skill: "Problem-Solving", text: "We are good at solving problems together as a team." },
  { driver: "Plan", skill: "Problem-Solving", text: "We're solving the right problems in the right ways, causing our business to improve." },
  { driver: "Plan", skill: "Decision Making", text: "The pace and quality of our decision making is causing us to build momentum." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy is clear, documented and understood by our teams." },
  { driver: "Plan", skill: "Strategy", text: "Our teams are effectively using our strategy as a filter for decision making." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy is allowing us to better serve our customer in a way that our competition can't." },
  { driver: "Plan", skill: "Strategy", text: "Our strategy has caused us to be the top performer in our market (we are in a winning position)." },
  { driver: "Plan", skill: "Goal Setting", text: "Our goals are clear, and our teams understand them." },
  { driver: "Plan", skill: "Goal Setting", text: "We are regularly reporting progress to our goals." },
  { driver: "Plan", skill: "Goal Setting", text: "Our team is challenging themselves to set stretch goals." },
  { driver: "Plan", skill: "Goal Setting", text: "We are regularly achieving challenging goals." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure is intentionally designed and understood by our whole team." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure enables our team to be highly collaborative and effective." },
  { driver: "Plan", skill: "Team Structure", text: "Our team structure is designed to support our long-term strategy." },
  { driver: "Plan", skill: "Process", text: "Our processes are well designed and clearly documented." },
  { driver: "Plan", skill: "Process", text: "Our processes work to improve efficiency and effectiveness." },
  { driver: "Plan", skill: "Process", text: "Our processes support and create a great customer experience." },

  // Product (Questions 57-79 in Excel, index 53-75 in our array)
  { driver: "Product", skill: "Thought Leadership", text: "The audience/customer base we've built is creating new customers." },
  { driver: "Product", skill: "Thought Leadership", text: "We are thought leaders in our industry/market." },
  { driver: "Product", skill: "Product Strategy", text: "We have a clear, and documented product strategy(s) that our entire team understands." },
  { driver: "Product", skill: "Product Strategy", text: "Our team is effectively innovating and improving each of our products." },
  { driver: "Product", skill: "Product Strategy", text: "Our products are so good we're outpacing the competition." },
  { driver: "Product", skill: "Customer Insights", text: "We listen to our customers and we're documenting their feedback and insights." },
  { driver: "Product", skill: "Customer Insights", text: "We are using insights from our customers to improve their experience." },
  { driver: "Product", skill: "Marketing & Sales", text: "Our marketing and sales efforts are building awareness of our brand." },
  { driver: "Product", skill: "Marketing & Sales", text: "We're converting potential customers to paying customers at an increasing pace." },
  { driver: "Product", skill: "Market Analysis", text: "Our knowledge of the market is enabling us to find new opportunities." },
  { driver: "Product", skill: "Market Analysis", text: "We're using our understanding of the market to shape our business strategy." },
  { driver: "Product", skill: "Target Market", text: "We have clearly defined the market(s) we want to compete in." },
  { driver: "Product", skill: "Target Market", text: "We are actively pursuing new business opportunities within our target market(s)" },
  { driver: "Product", skill: "Target Customer", text: "We have clearly defined our ideal target customer(s)" },
  { driver: "Product", skill: "Target Customer", text: "We know where and how to reach our target customer(s)." },
  { driver: "Product", skill: "Target Customer", text: "We are effectively connecting with our target customer(s)." },
  { driver: "Product", skill: "Target Customer", text: "We are finding new ways to serve our target customer(s)." },
  { driver: "Product", skill: "Customer Service", text: "Our team is proactively creating a great customer experience." },
  { driver: "Product", skill: "Customer Service", text: "Our business has become known for our customer service." },
  { driver: "Product", skill: "Innovation", text: "Our teams regularly devote real resources to research, experimentation and innovation." },
  { driver: "Product", skill: "Innovation", text: "Our innovations are resulting in the creation of new products/services that our customers love." },
  { driver: "Product", skill: "Technology", text: "We're intelligently using technology in our business to solve problems." },
  { driver: "Product", skill: "Technology", text: "Technology is accelerating the execution of our strategy." },

  // Profit (Questions 80-90 in Excel, index 76-86 in our array) - Note: 11 questions, not 10
  { driver: "Profit", skill: "Business Development", text: "We are leveraging strong relationships to expand into new markets." },
  { driver: "Profit", skill: "Business Development", text: "We are successfully acquiring new customers in new markets." },
  { driver: "Profit", skill: "Performance Management", text: "We have built key reports and scorecards." },
  { driver: "Profit", skill: "Performance Management", text: "We have healthy accountability for performance." },
  { driver: "Profit", skill: "Performance Management", text: "Our teams are hitting goals more often than ever." },
  { driver: "Profit", skill: "Profit Margin", text: "Our profit margin is steadily growing over time." },
  { driver: "Profit", skill: "Profit Investment", text: "We're investing our profits wisely." },
  { driver: "Profit", skill: "Forecasting", text: "We're carefully forecasting our revenue into the future." },
  { driver: "Profit", skill: "Forecasting", text: "Our forecasts are enabling us to catch potential problems faster" },
  { driver: "Profit", skill: "Expense Management", text: "We carefully and proactively manage our expenses." },
  { driver: "Profit", skill: "Revenue Growth", text: "Our top-line revenue is steadily growing over time." }
];

// Validation: Ensure we have exactly 82 questions
if (questionMapping.length !== 82) {
  console.warn(`WARNING: Expected 82 questions, but found ${questionMapping.length}`);
}

module.exports = questionMapping;
