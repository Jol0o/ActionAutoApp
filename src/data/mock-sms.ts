export const MOCK_SMS_LEADS = [
  {
    _id: "mock-sms-1",
    firstName: "Jordan",
    lastName: "Lloyd",
    email: "jordan@example.com",
    phone: "(801) 555-0123",
    channel: "sms",
    status: "New",
    vehicle: { year: "2024", make: "Tesla", model: "Model S" },
    comments: "Interested in a trade-in.",
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    _id: "mock-sms-2",
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah@example.com",
    phone: "(385) 444-9090",
    channel: "sms",
    status: "Pending",
    vehicle: { year: "2022", make: "Rivian", model: "R1S" },
    comments: "Looking for financing options.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
  },
  {
    _id: "mock-sms-3",
    firstName: "Marcus",
    lastName: "Aurelius",
    email: "marcus@rome.dealers",
    phone: "(801) 777-1234",
    channel: "sms",
    status: "Contacted",
    vehicle: { year: "2023", make: "Ford", model: "F-150 Lightning" },
    comments: "Needs a quote for a fleet of 5.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  }
];

export const MOCK_SMS_THREADS: Record<string, any[]> = {
  "mock-sms-1": [
    {
      id: "m1",
      content: "Hello! I saw the Tesla Model S on your site. Is it still available?",
      direction: "inbound",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "m2",
      content: "Yes it is! Would you like to schedule a viewing?",
      direction: "outbound",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "m3",
      content: "I'd love to. How about tomorrow at 2pm?",
      direction: "inbound",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "m4",
      content: "2pm works perfectly. We are located at 123 Auto Way, Lehi.",
      direction: "outbound",
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "m5",
      content: "Great, see you then!",
      direction: "inbound",
      timestamp: new Date(Date.now() - 600000).toISOString(),
    }
  ],
  "mock-sms-2": [
    {
      id: "m6",
      content: "Hi Sarah, this is Mike from Action Auto. Just checking in on your Rivian inquiry.",
      direction: "outbound",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "m7",
      content: "Thanks Mike! I'm still weighing my options but I'll let you know by Friday.",
      direction: "inbound",
      timestamp: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "m8",
      content: "No problem at all. Just so you know, we have a $2,000 rebate ending this week.",
      direction: "outbound",
      timestamp: new Date(Date.now() - 21600000).toISOString(),
    },
    {
      id: "m9",
      content: "Oh wow, that changes things. Can you send me the window sticker?",
      direction: "inbound",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    }
  ],
  "mock-sms-3": [
    {
      id: "m10",
      content: "Marcus, this is the fleet department. I have the quote ready for the 5 Lightnings.",
      direction: "outbound",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "m11",
      content: "Send it over. If the price is right, I'll sign today.",
      direction: "inbound",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    }
  ]
};
