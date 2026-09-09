import type { CompletedJob } from "../types";

export const COMPLETED_JOBS: CompletedJob[] = [
  {
    id: "job-10248",
    jobId: "GS-10248",
    serviceName: "Tap Repair",
    serviceCategory: "Plumbing",
    customerName: "Raj Sharma",
    customerImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 62",
    description: "Water leaking continuously from bathroom mixer tap and washbasin angle valve.",
    date: "08 Sep 2026",
    dateIso: "2026-09-08",
    time: "10:30 AM",
    duration: "1 hr 20 min",
    status: "Completed",
    completionTime: "11:50 AM",
    distanceTravelled: "4.2 km",
    arrivalTime: "10:30 AM",
    departureTime: "11:50 AM",
    workPerformed: "Replaced worn spindle gasket, reseated washer valve, tightened brass flange and calibrated water pressure.",
    additionalWork: "Cleaned aerator filter mesh and sealed minor pipe threading with PTFE tape.",
    baseServiceCharge: 350,
    materialCost: 100,
    additionalCharges: 0,
    totalAmount: 450,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Google Pay)",
    customerRating: 5.0,
    customerReview: "Rajesh arrived exactly on time and fixed the tap in under an hour without any mess. Very polite and professional service.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80",
        title: "Leaking Mixer Tap",
        desc: "Damaged rubber washer causing continuous dripping"
      },
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        title: "Angle Valve Corrosion",
        desc: "Mineral deposit buildup around threaded joint"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80",
        title: "Repaired Tap Assembly",
        desc: "New brass spindle fitted with zero leakage under high pressure"
      },
      {
        url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80",
        title: "Completed Sink Installation",
        desc: "Fully sealed and water tested"
      }
    ]
  },
  {
    id: "job-10235",
    jobId: "GS-10235",
    serviceName: "Electrical Repair",
    serviceCategory: "Electrical",
    customerName: "Ankit Verma",
    customerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 18",
    description: "Main circuit breaker tripping repeatedly when air conditioner and geyser turn on.",
    date: "06 Sep 2026",
    dateIso: "2026-09-06",
    time: "02:15 PM",
    duration: "1 hr 45 min",
    status: "Completed",
    completionTime: "04:00 PM",
    distanceTravelled: "6.8 km",
    arrivalTime: "02:15 PM",
    departureTime: "04:00 PM",
    workPerformed: "Diagnosed phase imbalance, replaced faulty 32A C-curve MCB with heavy-duty Schneider unit, and retightened busbar connections.",
    additionalWork: "Conducted neutral leakage current test on power sockets.",
    baseServiceCharge: 450,
    materialCost: 250,
    additionalCharges: 0,
    totalAmount: 700,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    customerRating: 4.8,
    customerReview: "Very knowledgeable technician. Identified the overloaded breaker instantly and replaced it safely with proper safety gear.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80",
        title: "Tripping MCB Panel",
        desc: "Burn marks on terminal contact"
      },
      {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
        title: "Loose Wiring Busbar",
        desc: "Exposed neutral connection"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80",
        title: "Replaced 32A MCB",
        desc: "Properly color-coded and insulated phase wiring"
      }
    ]
  },
  {
    id: "job-10221",
    jobId: "GS-10221",
    serviceName: "Fan Installation & Repair",
    serviceCategory: "Electrical",
    customerName: "Priya Patel",
    customerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    locality: "Indirapuram",
    description: "Living room ceiling fan making humming noise, low speed, and wobbling violently.",
    date: "05 Sep 2026",
    dateIso: "2026-09-05",
    time: "11:00 AM",
    duration: "55 min",
    status: "Completed",
    completionTime: "11:55 AM",
    distanceTravelled: "3.5 km",
    arrivalTime: "11:00 AM",
    departureTime: "11:55 AM",
    workPerformed: "Replaced degraded 2.5 mfd capacitor, balanced fan blades with counterweights, and lubricated ball bearings.",
    additionalWork: "Tightened ceiling downrod safety bolt and safety wire clamp.",
    baseServiceCharge: 300,
    materialCost: 80,
    additionalCharges: 0,
    totalAmount: 380,
    paymentStatus: "Paid",
    paymentMethod: "UPI (PhonePe)",
    customerRating: 5.0,
    customerReview: "Fan is running completely silent and at full speed now. Highly recommended for home electrical repairs!",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80",
        title: "Wobbling Ceiling Fan",
        desc: "Loose downrod mount"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=80",
        title: "Balanced Fan Assembly",
        desc: "New capacitor installed and tested at speed level 5"
      }
    ]
  },
  {
    id: "job-10204",
    jobId: "GS-10204",
    serviceName: "Pipe Leakage Repair",
    serviceCategory: "Plumbing",
    customerName: "Vikram Malhotra",
    customerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 50",
    description: "Water seepage beneath kitchen sink cabinet from drain pipe joint.",
    date: "03 Sep 2026",
    dateIso: "2026-09-03",
    time: "03:30 PM",
    duration: "1 hr 10 min",
    status: "Completed",
    completionTime: "04:40 PM",
    distanceTravelled: "5.1 km",
    arrivalTime: "03:30 PM",
    departureTime: "04:40 PM",
    workPerformed: "Removed cracked PVC sink waste pipe, installed heavy-duty expandable flex pipe with rubber gaskets and silicone sealant.",
    additionalWork: "Cleared grease clog in floor drain trap.",
    baseServiceCharge: 400,
    materialCost: 180,
    additionalCharges: 0,
    totalAmount: 580,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Paytm)",
    customerRating: 4.9,
    customerReview: "Quick and efficient work. Kept the kitchen area dry and clean throughout.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        title: "Cracked Sink Drain Pipe",
        desc: "Water leakage into wooden modular cabinet"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=500&auto=format&fit=crop&q=80",
        title: "New Sealed Drain Pipe",
        desc: "Leakproof silicone sealed coupling"
      }
    ]
  },
  {
    id: "job-10192",
    jobId: "GS-10192",
    serviceName: "Switchboard Repair",
    serviceCategory: "Electrical",
    customerName: "Sunita Deshmukh",
    customerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 76",
    description: "Master bedroom 6-module switchboard sparking and loose plug socket.",
    date: "01 Sep 2026",
    dateIso: "2026-09-01",
    time: "09:15 AM",
    duration: "45 min",
    status: "Completed",
    completionTime: "10:00 AM",
    distanceTravelled: "2.8 km",
    arrivalTime: "09:15 AM",
    departureTime: "10:00 AM",
    workPerformed: "Replaced 2 burnt modular 16A switches and 1 universal 3-pin socket with Anchor Roma modules.",
    additionalWork: "Re-crimped copper wire terminals and verified earthing connectivity.",
    baseServiceCharge: 300,
    materialCost: 190,
    additionalCharges: 0,
    totalAmount: 490,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    customerRating: 5.0,
    customerReview: "Great service! Very careful with electricity safety and neatly finished.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80",
        title: "Burnt Switch Board",
        desc: "Carbonization on backplate"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80",
        title: "New Modular Plate",
        desc: "Tested with voltage multimeter"
      }
    ]
  },
  {
    id: "job-10178",
    jobId: "GS-10178",
    serviceName: "Carpentry",
    serviceCategory: "Carpentry",
    customerName: "Amit Banerjee",
    customerImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 15",
    description: "Bedroom wardrobe hydraulic hinge unhinged and drawer track stuck.",
    date: "28 Aug 2026",
    dateIso: "2026-08-28",
    time: "01:30 PM",
    duration: "1 hr 30 min",
    status: "Completed",
    completionTime: "03:00 PM",
    distanceTravelled: "7.4 km",
    arrivalTime: "01:30 PM",
    departureTime: "03:00 PM",
    workPerformed: "Replaced broken soft-close hydraulic hinges with Ebco fittings, aligned shutter doors, and fitted new ball-bearing drawer telescopic channel.",
    additionalWork: "Planed bottom edge of door to stop floor rubbing.",
    baseServiceCharge: 500,
    materialCost: 350,
    additionalCharges: 0,
    totalAmount: 850,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Google Pay)",
    customerRating: 4.8,
    customerReview: "Wardrobe door closes like new now. Skilled carpenter with all proper tools.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop&q=80",
        title: "Detached Wardrobe Shutter",
        desc: "Stripped wooden screw holes"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=80",
        title: "Fitted Soft-Close Hinges",
        desc: "Aligned perfectly with magnetic latch"
      }
    ]
  },
  {
    id: "job-10165",
    jobId: "GS-10165",
    serviceName: "Cleaning",
    serviceCategory: "Cleaning",
    customerName: "Meenakshi Sundaram",
    customerImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 44",
    description: "Deep chemical cleaning and descaling of 2 bathrooms and kitchen tiles.",
    date: "24 Aug 2026",
    dateIso: "2026-08-24",
    time: "10:00 AM",
    duration: "2 hr 30 min",
    status: "Completed",
    completionTime: "12:30 PM",
    distanceTravelled: "4.9 km",
    arrivalTime: "10:00 AM",
    departureTime: "12:30 PM",
    workPerformed: "Pressure cleaned hard water stains from tiles, polished chrome bath fittings, scrubbed exhaust ducts, and sanitized sanitaryware.",
    additionalWork: "Applied anti-fungal grout sealant around shower cubicle base.",
    baseServiceCharge: 800,
    materialCost: 150,
    additionalCharges: 0,
    totalAmount: 950,
    paymentStatus: "Paid",
    paymentMethod: "UPI (PhonePe)",
    customerRating: 5.0,
    customerReview: "Sparkling clean bathrooms! Hard water yellow stains completely disappeared.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        title: "Limescale Stained Tiles",
        desc: "Heavy mineral scaling"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=80",
        title: "Cleaned Bathroom Floor",
        desc: "Mirror finish tiles and sanitized floor"
      }
    ]
  },
  {
    id: "job-10151",
    jobId: "GS-10151",
    serviceName: "Painting",
    serviceCategory: "Painting",
    customerName: "Rohit Kapoor",
    customerImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 137",
    description: "Water seepage paint peel repair and 2 coats acrylic emulsion painting on living room feature wall.",
    date: "18 Aug 2026",
    dateIso: "2026-08-18",
    time: "09:30 AM",
    duration: "3 hr 15 min",
    status: "Completed",
    completionTime: "12:45 PM",
    distanceTravelled: "8.2 km",
    arrivalTime: "09:30 AM",
    departureTime: "12:45 PM",
    workPerformed: "Scraped flaking paint, applied waterproofing primer coat, smoothed with Birla White wall putty, and rolled 2 coats Asian Paints Royale emulsion.",
    additionalWork: "Masked floor skirting and electrical switchboards with masking tape.",
    baseServiceCharge: 1100,
    materialCost: 400,
    additionalCharges: 0,
    totalAmount: 1500,
    paymentStatus: "Paid",
    paymentMethod: "Net Banking",
    customerRating: 4.9,
    customerReview: "Color matching was 100% accurate and the finish is silky smooth. Cleaned the floor before leaving.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80",
        title: "Flaking Wall Paint",
        desc: "Moisture blister on wall surface"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80",
        title: "Finished Royale Emulsion",
        desc: "Uniform matte luxury finish"
      }
    ]
  },
  {
    id: "job-10138",
    jobId: "GS-10138",
    serviceName: "Appliance Repair",
    serviceCategory: "Appliance Repair",
    customerName: "Kavita Joshi",
    customerImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 22",
    description: "Fully automatic washing machine vibrating excessively during spin cycle and error E3.",
    date: "10 Aug 2026",
    dateIso: "2026-08-10",
    time: "11:30 AM",
    duration: "1 hr 15 min",
    status: "Completed",
    completionTime: "12:45 PM",
    distanceTravelled: "4.0 km",
    arrivalTime: "11:30 AM",
    departureTime: "12:45 PM",
    workPerformed: "Replaced broken suspension shock damper rods on drum, leveled appliance feet, and cleared coin trap filter.",
    additionalWork: "Recalibrated spin sensor program cycle.",
    baseServiceCharge: 450,
    materialCost: 350,
    additionalCharges: 0,
    totalAmount: 800,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Paytm)",
    customerRating: 4.7,
    customerReview: "Technician came with genuine spare parts. Machine runs silently now during the 1200 RPM spin.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=80",
        title: "Vibrating Washing Drum",
        desc: "Broken shock damper strut"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        title: "Installed Damper Suspension",
        desc: "Spin cycle tested without vibration"
      }
    ]
  },
  {
    id: "job-10122",
    jobId: "GS-10122",
    serviceName: "Tap Repair",
    serviceCategory: "Plumbing",
    customerName: "Harpreet Singh",
    customerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 34",
    description: "Overhead water storage tank float ball valve jammed causing overflow on terrace.",
    date: "02 Aug 2026",
    dateIso: "2026-09-02",
    time: "08:30 AM",
    duration: "50 min",
    status: "Completed",
    completionTime: "09:20 AM",
    distanceTravelled: "3.2 km",
    arrivalTime: "08:30 AM",
    departureTime: "09:20 AM",
    workPerformed: "Replaced stuck plastic float valve with heavy-duty brass ball cock float valve and resealed tank inlet pipe.",
    additionalWork: "Fitted emergency overflow drain pipe extension.",
    baseServiceCharge: 350,
    materialCost: 200,
    additionalCharges: 0,
    totalAmount: 550,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    customerRating: 5.0,
    customerReview: "Prompt response early in the morning saved gallons of water from overflowing.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&auto=format&fit=crop&q=80",
        title: "Overflowing Water Tank",
        desc: "Defective plastic float rod"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80",
        title: "New Brass Float Installed",
        desc: "Auto shutoff working smoothly"
      }
    ]
  },
  {
    id: "job-10109",
    jobId: "GS-10109",
    serviceName: "Electrical Repair",
    serviceCategory: "Electrical",
    customerName: "Deepa Nair",
    customerImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 93",
    description: "Inverter battery backup not charging and high pitched alarm beeping.",
    date: "25 Jul 2026",
    dateIso: "2026-07-25",
    time: "04:00 PM",
    duration: "1 hr 10 min",
    status: "Completed",
    completionTime: "05:10 PM",
    distanceTravelled: "6.5 km",
    arrivalTime: "04:00 PM",
    departureTime: "05:10 PM",
    workPerformed: "Cleaned oxidized battery terminal posts, topped up distilled water cells, and replaced blown 40A DC charging fuse.",
    additionalWork: "Treated battery terminal clamps with petroleum jelly against corrosion.",
    baseServiceCharge: 400,
    materialCost: 120,
    additionalCharges: 0,
    totalAmount: 520,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Google Pay)",
    customerRating: 5.0,
    customerReview: "Very reliable service. Inverter charged back to 100% within two hours.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=80",
        title: "Sulfated Battery Terminal",
        desc: "Heavy blue corrosion buildup"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80",
        title: "Cleaned & Greased Terminals",
        desc: "Full charging voltage restored"
      }
    ]
  },
  {
    id: "job-10095",
    jobId: "GS-10095",
    serviceName: "Carpentry",
    serviceCategory: "Carpentry",
    customerName: "Manoj Tiwari",
    customerImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 12",
    description: "Teakwood dining table leg wobbly and 2 dining chairs loose joints.",
    date: "15 Jul 2026",
    dateIso: "2026-07-15",
    time: "02:00 PM",
    duration: "1 hr 40 min",
    status: "Completed",
    completionTime: "03:40 PM",
    distanceTravelled: "5.5 km",
    arrivalTime: "02:00 PM",
    departureTime: "03:40 PM",
    workPerformed: "Disassembled loose mortise and tenon joints, re-glued with Fevicol Marine grade adhesive, clamped with G-clamps, and reinforced with corner metal brackets.",
    additionalWork: "Fitted felt scratch pads on table and chair legs.",
    baseServiceCharge: 550,
    materialCost: 150,
    additionalCharges: 0,
    totalAmount: 700,
    paymentStatus: "Paid",
    paymentMethod: "UPI (PhonePe)",
    customerRating: 4.8,
    customerReview: "Super sturdy repair! The dining chairs don't shake at all now.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&auto=format&fit=crop&q=80",
        title: "Loose Chair Joint",
        desc: "Dried adhesive separation"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=500&auto=format&fit=crop&q=80",
        title: "Reinforced Tenon Joint",
        desc: "Clamped and bracket reinforced"
      }
    ]
  },
  {
    id: "job-10081",
    jobId: "GS-10081",
    serviceName: "Cleaning",
    serviceCategory: "Cleaning",
    customerName: "Neha Saxena",
    customerImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 29",
    description: "Kitchen chimney deep degreasing and baffle filter chemical wash.",
    date: "05 Jul 2026",
    dateIso: "2026-07-05",
    time: "10:30 AM",
    duration: "1 hr 25 min",
    status: "Completed",
    completionTime: "11:55 AM",
    distanceTravelled: "3.8 km",
    arrivalTime: "10:30 AM",
    departureTime: "11:55 AM",
    workPerformed: "Dismantled baffle filters, soaked in caustic degreasing solution, steamed motor housing impeller, and wiped stainless steel hood.",
    additionalWork: "Replaced non-working LED halogen spot bulb inside chimney hood.",
    baseServiceCharge: 500,
    materialCost: 120,
    additionalCharges: 0,
    totalAmount: 620,
    paymentStatus: "Paid",
    paymentMethod: "Cash",
    customerRating: 5.0,
    customerReview: "Chimney suction is back to brand new condition. Very hygienic service.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80",
        title: "Grease Choked Chimney",
        desc: "Heavy carbon oil deposit"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        title: "Cleaned Stainless Hood",
        desc: "Baffle filters washed and dried"
      }
    ]
  },
  {
    id: "job-10068",
    jobId: "GS-10068",
    serviceName: "Painting",
    serviceCategory: "Painting",
    customerName: "Ramesh Gupta",
    customerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    locality: "Sector 41",
    description: "Terrace parapet wall dampness treatment and waterproof elastomeric exterior paint coating.",
    date: "20 Jun 2026",
    dateIso: "2026-06-20",
    time: "08:00 AM",
    duration: "3 hr 00 min",
    status: "Completed",
    completionTime: "11:00 AM",
    distanceTravelled: "6.0 km",
    arrivalTime: "08:00 AM",
    departureTime: "11:00 AM",
    workPerformed: "Filled hairline parapet cracks with Dr. Fixit CrackX paste, applied 1 coat Primeseal primer, and 2 coats Dampguard exterior membrane paint.",
    additionalWork: "Sealed rainwater drain spout joint with epoxy putty.",
    baseServiceCharge: 1200,
    materialCost: 450,
    additionalCharges: 0,
    totalAmount: 1650,
    paymentStatus: "Paid",
    paymentMethod: "UPI (Google Pay)",
    customerRating: 4.9,
    customerReview: "Handled terrace waterproofing with great expertise before the monsoon started.",
    beforeWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80",
        title: "Cracked Parapet Wall",
        desc: "Rainwater seepage penetration"
      }
    ],
    afterWorkPhotos: [
      {
        url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop&q=80",
        title: "Waterproof Coated Wall",
        desc: "Weatherproof flexible membrane finish"
      }
    ]
  }
];
