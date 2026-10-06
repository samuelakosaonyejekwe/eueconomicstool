// Strategy library. Each entry is a policy or market design option, described
// for the EU setting with its legal and institutional fit.
// fit: how strongly it addresses each pressure (0-3). speed: 1 = weeks, 2 = months, 3 = years.
// fisc: budget cost 0 none .. 3 high. feas: 2 = usable within current EU rules,
// 1 = needs careful legal design, 0 = needs EU-level agreement or Treaty-level change,
// -1 = not workable in the form proposed (the note says what is). scope: all | noneuro (members with their own currency) | eu (Union or euro-area level).
function S(id, n, ac, cat, who, fit, speed, fisc, feas, scope, d, eu) {
  return { id: id, n: n, ac: ac, cat: cat, who: who, fit: fit, speed: speed, fisc: fisc, feas: feas, scope: scope, d: d, eu: eu };
}

export const ROLES = [
  { k: 'all', n: 'All stakeholders' }, { k: 'gov', n: 'National government' }, { k: 'cb', n: 'Central bank' },
  { k: 'eu', n: 'EU institutions' }, { k: 'local', n: 'Regional & local authorities' },
  { k: 'biz', n: 'Business' }, { k: 'hh', n: 'Households & civil society' }, { k: 'res', n: 'Economists & researchers' }
];

// What each viewpoint should look for on each page. Shown under the page title when a viewpoint is chosen.
export const GUIDE = {
  gov: {
    overview: 'See where your country stands against the other members, then open it to find where the pressure comes from.',
    country: 'The gauges show which pressures tax, spending and regulation can act on. The strategies below are those a national government would lead.',
    inflation: 'Pressure in volatile items calls for targeted, temporary relief; pressure in slow-moving prices calls for broader restraint. The diagnosis tells you which you face.',
    currency: 'For euro members the exchange rate is not a national lever, so watch the external position. Members with their own currency can test the stabilisation tools.',
    simulator: 'The measures you decide are marked. Watch the budget cost and the balance against the 3% reference value.',
    strategies: 'The list is narrowed to strategies a national government would lead.',
    compare: 'Rank your country against its peers on inflation, public finances and the external balance.',
    method: 'Before using an estimate in a briefing, check what it rests on in the assumptions table.'
  },
  cb: {
    overview: 'Headline and core inflation across the Union, with the policy rate, at a glance.',
    country: 'Core and services inflation, wages and expectations show how persistent inflation is likely to be.',
    inflation: 'The hybrid index separates shock-sensitive from slow-moving prices; the early-warning view shows momentum and pressure in the pipeline.',
    currency: 'Volatility, the ERM II band and the external position, with tools that put numbers on stabilisation options.',
    simulator: 'The policy rate is the measure you decide. Fiscal measures are shown so their effect on inflation can be read alongside it.',
    strategies: 'The list is narrowed to strategies in which a central bank has a role.',
    compare: 'Compare persistence across members: core and services inflation, wages and expectations.',
    method: 'The pass-through and policy-rate assumptions, with the ECB studies behind them, are in the assumptions table.'
  },
  eu: {
    overview: 'The spread of inflation across members shows how far one policy fits all.',
    country: 'Each country’s pressures and fiscal room show where Union-level instruments would help most.',
    inflation: 'Imported and cost pressures shared by many members point to Union-level action on energy, trade and reserves.',
    currency: 'The six currencies outside the euro and the external positions of all members.',
    simulator: 'Measures marked for the Union level need agreement between members; national measures show what each state can do alone.',
    strategies: 'The list is narrowed to strategies that need, or benefit from, Union-level action.',
    compare: 'Rank the 27 on any indicator to see divergence and outliers.',
    method: 'Legal notes link to the acts they rest on and show whether each is still in force.'
  },
  local: {
    overview: 'National figures set the scene; price pressure in your area may be higher or lower.',
    country: 'Housing, energy and food are where regional and local authorities can act most directly.',
    inflation: 'The spending categories show which household costs are rising fastest, which guides local relief.',
    currency: 'Mostly a national and Union matter; the external position shows how exposed your country is to imported price rises.',
    simulator: 'Rent rules and targeted relief are the measures where regional and local authorities usually have a say; they are marked.',
    strategies: 'The list is narrowed to strategies a regional or local authority can run or host.',
    compare: 'Compare your country with its neighbours on housing costs, unemployment and prices.',
    method: 'Sources and limits are listed so figures can be quoted with their date.'
  },
  biz: {
    overview: 'Where prices are rising fastest across your markets, and where interest rates stand.',
    country: 'Wage growth, producer prices and energy show where your costs are heading.',
    inflation: 'The early-warning view and producer prices help in timing price changes; the components show where input costs are rising.',
    currency: 'The rate-lock calculator shows what fixing an exchange rate is worth on an import bill.',
    simulator: 'These are decisions for governments and central banks; use the simulator to see how measures under discussion would affect prices and demand.',
    strategies: 'The list is narrowed to strategies that businesses can take part in or lead.',
    compare: 'Compare cost and demand conditions across the countries you sell in.',
    method: 'Each figure can be traced to its source and date before it goes into a plan.'
  },
  hh: {
    overview: 'How fast prices are rising where you live, compared with the rest of the Union.',
    country: 'The spending categories show which everyday costs are rising fastest.',
    inflation: 'Open “Personal inflation” to see how price rises hit your own budget and which categories matter most for you.',
    currency: 'If you are paid, save or borrow in another currency, the monitor shows how it has moved against the euro.',
    simulator: 'These are decisions for governments and central banks; the simulator shows what measures being debated would mean for prices.',
    strategies: 'The list is narrowed to strategies households and community groups can use or take part in.',
    compare: 'See how your country compares on prices, wages and unemployment.',
    method: 'Where every number comes from, and how to install the tool on your phone.'
  },
  res: {
    overview: 'Live HICP, labour-market, national-accounts and exchange-rate series for all 27 members.',
    country: 'Every figure links to its Eurostat or ECB series; charts can be opened as tables.',
    inflation: 'Gauge definitions, basket weights and the projection rule are set out under Data & Method.',
    currency: 'Daily ECB reference rates over two years, with volatility and a basket calculator.',
    simulator: 'Every coefficient is listed with its range and the studies behind it; results are first-year and partial.',
    strategies: 'All strategies are shown, each with its legal basis and source.',
    compare: 'Rank and chart any indicator; the underlying data can be downloaded under Data & Method.',
    method: 'Sources, formulas, assumptions with references, and known limits.'
  }
};

export const STRATEGIES = [
  // Data & early warning
  S('ews', 'Inflation forecasting ecosystem', 'IFDE', 'Data & early warning', ['gov', 'cb', 'eu', 'res'], { dem: 2, cost: 2, imp: 2, exp: 2 }, 2, 1, 2, 'all',
    'A shared early-warning system that reads trade flows, supply chains, labour markets and prices to flag inflation risks months ahead and push tailored alerts to ministries, banks, retailers and households.',
    'Builds on Eurostat flash estimates and the ECB and Commission forecasts. The early-warning view in this tool is a small working example.'),
  S('supplyai', 'Supply-chain risk prediction', 'ASCPM', 'Data & early warning', ['gov', 'eu', 'biz'], { cost: 3, imp: 3 }, 2, 1, 2, 'all',
    'Models that combine weather, shipping, geopolitical and raw-material data to predict supply disruptions early enough to pre-stock or switch suppliers.',
    'Fits the monitoring role of the Internal Market Emergency and Resilience Act and the Critical Raw Materials Act stress tests.'),
  S('hybridcpi', 'Hybrid price index', 'HCPI', 'Data & early warning', ['cb', 'res', 'eu'], { dem: 1, cost: 2, exp: 1 }, 1, 0, 2, 'all',
    'Split the consumer basket into inflation-sensitive and inflation-resistant groups and track them separately, so support is aimed at what is actually driving the index.',
    'Computable today from Eurostat HICP special aggregates; see the Inflation Lab.'),
  S('localidx', 'Regional price indexes', 'LPICS', 'Data & early warning', ['local', 'gov', 'res'], { hou: 2, cost: 1, dem: 1 }, 3, 1, 2, 'all',
    'Price indexes at regional and city level, so that relief follows where prices are really rising rather than the national average.',
    'HICP is national. Regional indexes exist in some members (for example Italy, Spain, Germany) and could be harmonised at NUTS-2.'),
  S('pricewatch', 'Open price transparency network', 'OSIMN / CPSN / EPTI', 'Data & early warning', ['hh', 'gov', 'local', 'biz'], { cost: 2, exp: 2, dem: 1 }, 2, 0, 2, 'all',
    'A public, open platform where shoppers and retailers post current prices of essentials. Outliers are flagged automatically and consumers can see where prices are fair.',
    'Compatible with competition law if it shows consumer prices rather than enabling supplier coordination. Several members run fuel and grocery price observatories.'),
  S('ledger', 'Tamper-proof price ledger', 'BPTL / BBA-Network', 'Data & early warning', ['gov', 'eu', 'biz'], { cost: 2, exp: 1 }, 3, 1, 1, 'all',
    'Large producers and retailers record price changes for essentials on a shared, auditable ledger so regulators can compare them with input costs.',
    'Needs a legal basis for mandatory reporting; must respect business-secrets and competition rules.'),
  S('confidence', 'Price confidence index', 'CPCI', 'Data & early warning', ['cb', 'gov', 'res'], { exp: 3 }, 1, 0, 2, 'all',
    'A frequent index of how the public perceives and expects prices to move, used to steer communication and act before expectations de-anchor.',
    'The Commission consumer survey and the ECB Consumer Expectations Survey already provide the raw material; this tool charts the survey balance.'),
  S('healthmap', 'Household financial health map', 'PFHMT', 'Data & early warning', ['gov', 'local', 'res'], { dem: 1, hou: 1, cost: 1 }, 2, 1, 2, 'all',
    'Maps spending, debt and financial stress by region and income group to show where inflation bites hardest and guide targeted support.',
    'Draws on EU-SILC and the Household Finance and Consumption Survey; personal data must be handled under the GDPR.'),

  // Essentials & prices
  S('varvat', 'Variable VAT for inflation control', 'VVIC', 'Tax & fiscal design', ['gov'], { cost: 3, dem: 1 }, 1, 2, 2, 'all',
    'Lower VAT on essentials while inflation is high and restore it as prices settle, with the option of funding part of it from discretionary items.',
    'Reduced and zero rates on food are permitted since Directive (EU) 2022/542. A rate above the standard rate is not; use excise duties for non-essentials.'),
  S('smartsub', 'Smart subsidy reallocation', 'SSRM / DRAIM', 'Tax & fiscal design', ['gov'], { cost: 3, imp: 1 }, 2, 1, 2, 'all',
    'Move existing subsidy budgets month by month towards the essentials whose prices are rising fastest, instead of adding new broad schemes.',
    'Budget-neutral by design, which helps under the EU net-expenditure rule (Regulation (EU) 2024/1263). Subsidies to producers that amount to State aid must be notified to the Commission unless they are block-exempted or de minimis.'),
  S('pricecap', 'Smart, temporary price caps on essentials', 'SDPC / FEPAS / AECPCP', 'Essentials & prices', ['gov'], { cost: 3, exp: 2 }, 1, 2, 1, 'all',
    'Automatic, time-limited ceilings on a short list of essentials when prices spike, with compensation that keeps suppliers selling.',
    'Caps must be non-discriminatory and proportionate. In Case C-557/23 (2024) the Court of Justice held that Hungary\'s regulated prices and mandatory sales quantities for basic foods breached Regulation (EU) No 1308/2013. Use sparingly and with sunset dates.'),
  S('ciap', 'Fair-pricing certification and incentives', 'CIAP / SRBC / GBISP', 'Essentials & prices', ['gov', 'biz', 'local'], { cost: 2, exp: 2, dem: 1 }, 2, 1, 2, 'all',
    'Voluntary agreements in which firms limit price rises on essentials in return for a public fair-pricing label, tax relief or lighter fees.',
    'France ran a voluntary \'anti-inflation quarter\' with retailers in 2023; Greece\'s \'household basket\' was compulsory for supermarket chains with turnover above €90 million. Agreements must be open to all and not coordinate prices between competitors.'),
  S('watchdog', 'Consumer protection coalition', 'ILCPC / LIWG', 'Essentials & prices', ['gov', 'local', 'hh'], { cost: 2, exp: 2 }, 2, 0, 2, 'all',
    'Regulators, consumer bodies and local volunteers monitor essentials for unjustified price rises and refer cases for investigation.',
    'Fits the Consumer Protection Cooperation network and national competition authorities’ sector inquiries.'),
  S('coopprice', 'Essential goods purchasing cooperatives', 'EGCPP / AICF', 'Essentials & prices', ['biz', 'local', 'hh'], { cost: 2, imp: 1 }, 2, 0, 2, 'all',
    'Small retailers and producers pool purchases of essentials and inputs to win bulk prices and hold shared emergency stocks.',
    'Cooperatives are well established in EU law; joint purchasing is allowed below market-share thresholds in the horizontal guidelines.'),
  S('market', 'Inflation-adaptive community markets', 'IACM / LEIBZ', 'Essentials & prices', ['local'], { cost: 2, hou: 1 }, 2, 2, 2, 'all',
    'Municipal markets and designated districts where essentials are sold at stabilised prices, with the subsidy scaled to local inflation.',
    'Responsibility for municipal markets is set by national law. The European Social Fund Plus (Regulation (EU) 2021/1057) can finance food and basic material assistance for the most deprived, so target by need.'),
  S('retailfc', 'Inflation forecasts for retailers', 'RTIFR / PIRT', 'Essentials & prices', ['biz'], { cost: 2, exp: 2 }, 2, 0, 2, 'all',
    'Give retailers and small firms sector-level cost forecasts and training so they adjust prices gradually instead of over-reacting to short-term swings.',
    'Deliverable through chambers of commerce and the Enterprise Europe Network.'),

  // Household protection
  S('relief', 'Real-time targeted relief accounts', 'DRIS / CIRA / VFPA', 'Household protection', ['gov', 'local'], { cost: 3, dem: 0 }, 1, 2, 2, 'all',
    'Digital accounts for low- and middle-income households that are topped up automatically when inflation in essentials passes a threshold, and taper as it falls.',
    'Targeted and temporary support is what the Commission and ECB recommend; it adds less to demand than broad price subsidies.'),
  S('tiered', 'Income-tiered essentials support', 'MTEGAP', 'Household protection', ['gov', 'local'], { cost: 2, hou: 1 }, 2, 2, 2, 'all',
    'Discounts on food, health and housing costs that are larger for lower incomes and scale with the inflation rate.',
    'Uses existing social-benefit registers; a national competence.'),
  S('taxrelief', 'Inflation-indexed tax relief', 'IITRS', 'Tax & fiscal design', ['gov'], { dem: 0, cost: 2, wage: 1 }, 2, 2, 2, 'all',
    'Index income-tax thresholds and credits to inflation so that households are not pushed into higher tax by price rises alone.',
    'Several members index brackets automatically. Under the EU net-expenditure rule the Commission counts the extra revenue from not indexing brackets to prices as a discretionary revenue measure, so indexation to inflation is the neutral baseline rather than a measure.'),
  S('tracker', 'Personal inflation tracker', 'PIAF / RIITH / AIRRA', 'Household protection', ['hh', 'biz', 'local'], { cost: 1, exp: 2, dem: 1 }, 1, 0, 2, 'all',
    'A tool that shows each household its own inflation rate from its spending pattern, flags the items driving it and suggests substitutions.',
    'Built into this tool under Inflation Lab → Personal inflation.'),
  S('literacy', 'Inflation literacy programmes', 'AIIEP / CILP / DILC', 'Household protection', ['local', 'hh', 'gov'], { exp: 2, dem: 1 }, 3, 0, 2, 'all',
    'Workshops, online modules and personal coaching on budgeting through inflation, to reduce panic buying and anchor expectations.',
    'Fits national financial-literacy strategies and the EU/OECD financial competence framework.'),
  S('debt', 'Time-adjusted debt relief', 'TADR / ACCIRM', 'Household protection', ['gov', 'cb', 'biz'], { dem: 0, hou: 2, cost: 1 }, 2, 1, 1, 'all',
    'Automatic, temporary extension of loan terms or payment relief for strained borrowers when inflation and rates surge, to prevent defaults.',
    'Must follow the Mortgage Credit Directive forbearance rules and EBA guidance so that loans are not misclassified.'),
  S('health', 'Inflation-adjusted health-cost support', 'IAHCAP', 'Household protection', ['gov'], { cost: 1 }, 2, 2, 2, 'all',
    'Health co-payment support that rises automatically with medical price inflation for low- and middle-income families.',
    'A national competence within social security systems.'),

  // Supply & reserves
  S('reserves', 'Strategic reserves of essentials', 'SREGS / CPEP / SNRPB', 'Supply & reserves', ['gov', 'eu'], { cost: 3, imp: 3 }, 2, 2, 2, 'all',
    'Build stocks of grain, fuel, medicines and key materials when prices are low and release them step by step when prices spike.',
    'Emergency oil stocks of 90 days of net imports or 61 days of consumption, whichever is greater, are mandatory (Directive 2009/119/EC). Gas storage filling targets, extended to end-2027 by Regulation (EU) 2025/1733, and rescEU medical stockpiles are precedents.'),
  S('eupool', 'European inflation cooperative', 'GIC', 'Supply & reserves', ['eu', 'gov'], { cost: 2, imp: 3 }, 3, 2, 0, 'eu',
    'Member states pool reserves of essential commodities and buy jointly, so a member under price pressure can draw at stabilised prices.',
    'Joint gas purchasing (AggregateEU, 2023–2025, set up by Council Regulation (EU) 2022/2576) and joint vaccine procurement show the model. A permanent pool of essentials would need a new EU legal act proposed by the Commission.'),
  S('dssip', 'Dynamic supply-side incentives', 'DSSIP / REIP / RCPS', 'Supply & reserves', ['gov', 'eu'], { cost: 2, dem: 2 }, 3, 2, 1, 'all',
    'Tax credits that grow during inflation spikes for firms that expand output of essentials or cut their energy and material use.',
    'State aid: use the General Block Exemption Regulation (Regulation (EU) No 651/2014, which applies until 31 December 2026 and is being replaced) or the Clean Industrial Deal State Aid Framework, which allows tax credits for clean investment until 31 December 2030.'),
  S('agri', 'Inflation-linked agricultural expansion', 'ILA-EG / RTAPSM / DAN', 'Supply & reserves', ['gov', 'eu', 'local'], { cost: 3 }, 3, 2, 1, 'all',
    'Grants and storage support that switch on when food inflation passes a threshold, helping farmers raise output of the crops in shortest supply.',
    'EU-funded support runs through the Common Agricultural Policy, including the agricultural reserve of EUR 450 million a year under Regulation (EU) 2021/2116; nationally funded grants must respect EU State aid rules for agriculture.'),
  S('localsupply', 'Local supply-chain and food networks', 'LSCEP / LFSN / LRAN / UVFIR', 'Supply & reserves', ['local', 'biz', 'gov'], { cost: 2, imp: 3 }, 3, 1, 2, 'all',
    'Shorten supply chains: regional producer networks, shared storage, urban farming and local sourcing of inputs that are now imported.',
    'Supported by cohesion funds and the Commission\'s 2025 Vision for Agriculture and Food, which backs short food supply chains; under Directive 2014/24/EU public buyers may not discriminate by origin but can set freshness and sustainability criteria.'),
  S('circular', 'Circular-economy cost reduction', 'CEIRI / ZWPG / SPIC', 'Supply & reserves', ['biz', 'gov', 'eu'], { cost: 2, imp: 2 }, 3, 1, 2, 'all',
    'Incentives for recycled inputs and zero-waste production, lowering dependence on scarce imported raw materials.',
    'Aligned with the Circular Economy Action Plan and with Regulation (EU) 2024/1252 (Critical Raw Materials Act), whose 2030 benchmark is Union recycling capacity able to produce at least 25 % of annual consumption of strategic raw materials.'),
  S('logistics', 'Predictive logistics and distribution', 'APSCO / IRRDN', 'Supply & reserves', ['biz', 'gov', 'local'], { cost: 2, imp: 1 }, 2, 1, 2, 'all',
    'Forecast bottlenecks and pre-position stocks where demand will surge, so shortages do not turn into price spikes.',
    'Private-sector led, with public data from customs and transport systems.'),

  // Energy
  S('utility', 'Dynamic utility price stabilisation', 'DUPS / ICUP / ESSF', 'Energy', ['gov', 'local'], { cost: 3, exp: 1 }, 1, 3, 1, 'all',
    'Cap the pass-through of energy and water cost spikes to household bills for a limited time, compensating providers, with priority for vulnerable users.',
    'For electricity, Directive (EU) 2019/944 allows regulated prices for energy-poor or vulnerable households; since Directive (EU) 2024/1711, if the Council declares an electricity price crisis, below-cost prices may also be set for households and SMEs for a limited share of consumption.'),
  S('energycredit', 'Energy saving rewards and offset credits', 'ECRP / EIOC', 'Energy', ['gov', 'biz', 'hh'], { cost: 3, imp: 2 }, 2, 1, 2, 'all',
    'Pay households and firms for measured cuts in energy use, and issue credits redeemable against bills or efficient appliances.',
    'Supports the Energy Efficiency Directive savings obligation; the 2022 voluntary gas-demand cut is a precedent.'),
  S('energycoop', 'Community energy cooperatives', 'CEC', 'Energy', ['local', 'hh', 'gov'], { cost: 2, imp: 3 }, 3, 1, 2, 'all',
    'Locally owned renewable generation that supplies members at cost-based prices, insulating them from imported fuel prices.',
    'Renewable and citizen energy communities have a legal basis in the Renewable Energy and Electricity Directives.'),
  S('pricelock', 'Energy price stabilisation certificates', 'EPSC', 'Energy', ['biz', 'hh', 'gov'], { cost: 2, exp: 1 }, 2, 0, 2, 'all',
    'Tradable certificates that let households and small firms lock in a price for a fixed amount of energy in advance.',
    'Fixed-price contracts must be offered by larger suppliers under the 2024 market reform; certificates extend that idea.'),

  // Housing
  S('rentindex', 'Inflation-sensitive rent rules', 'ISRELM / AREPSP', 'Housing', ['gov', 'local'], { hou: 3 }, 1, 0, 2, 'all',
    'Limit annual rent increases to slightly below inflation, with tax relief or insurance for landlords who comply.',
    'A national competence. Spain, France, Portugal and others capped index-linked rent rises in 2022–23.'),
  S('rentaid', 'Inflation-indexed rent support', 'FGGRS / IPRAP', 'Housing', ['gov', 'local'], { hou: 3 }, 2, 2, 2, 'all',
    'Housing allowances for low- and middle-income tenants that rise automatically with local rent inflation.',
    'National and local competence; target carefully so the support is not absorbed into higher rents.'),
  S('housingfund', 'Affordable housing supply fund', 'IPHDi / IMREDF', 'Housing', ['gov', 'local', 'biz'], { hou: 3, dem: 1 }, 3, 2, 2, 'all',
    'A fund that builds energy-efficient homes let on long, fixed-rent contracts, financed by investors who receive inflation-linked returns.',
    'Social housing is a recognised service of general economic interest; the European Affordable Housing Plan and EIB lending can co-finance.'),
  S('mortgage', 'Mortgage interest cushion', 'ICMIS / AIRAT', 'Housing', ['gov', 'cb'], { hou: 2 }, 2, 2, 1, 'all',
    'Temporary, means-tested help with mortgage interest when rates rise sharply, to prevent forced sales.',
    'Works against monetary tightening if broad; keep it narrow and time-limited.'),
  S('mobility', 'Remote work and workforce mobility', 'DWMP / IDRWS', 'Housing', ['biz', 'gov', 'local'], { hou: 2, cost: 1 }, 3, 1, 2, 'all',
    'Incentives for employers to spread jobs to lower-cost regions and support remote work, easing housing and transport pressure in the dearest cities.',
    'Free movement of workers (Article 45 TFEU) permits relocation within the EU, but cross-border remote work can change which country\'s social security applies under Regulation (EC) No 883/2004; cohesion policy can co-fund regional hubs.'),

  // Wages & work
  S('wageplatform', 'Predictive wage adjustment', 'PWAP / IPEC / DPSWAP', 'Wages & work', ['gov', 'biz'], { wage: 2, dem: 1 }, 2, 1, 1, 'all',
    'Agree pay rises that follow forecast inflation in small, regular steps rather than large catch-up settlements after the event.',
    'Wage setting belongs to social partners. Forward-looking, partial indexation limits second-round effects; full backward indexation entrenches inflation.'),
  S('skills', 'Adaptive workforce development grants', 'AWDG', 'Wages & work', ['gov', 'eu', 'biz'], { wage: 3, dem: 1 }, 3, 2, 2, 'all',
    'Fund fast retraining into occupations with shortages, so that scarce skills do not drive pay and prices up.',
    'Retraining can be funded by the European Social Fund Plus under Regulation (EU) 2021/1057; the Pact for Skills is a partnership model that brings employers and training providers together and points to EU funding, but is not itself a fund.'),
  S('transit', 'Adaptive public transport pricing', 'APT-PM / FPTSS / AILTS', 'Wages & work', ['local', 'gov'], { cost: 2 }, 1, 2, 2, 'all',
    'Hold or cut public transport fares automatically when fuel and living costs surge, compensating operators.',
    'Germany’s flat-rate Deutschlandticket (EUR 63 a month since January 2026) and Spain’s free commuter and regional rail passes, which ended on 30 June 2025, are precedents; compensation to operators follows the public service obligation rules of Regulation (EC) No 1370/2007.'),

  // Savings & investment
  S('bonds', 'Inflation-protected retail savings', 'IPSB / UISB / IARSB / CCIHA', 'Savings & investment', ['gov', 'cb'], { dem: 1, exp: 2 }, 2, 1, 2, 'all',
    'Government savings bonds and accounts for households whose return tracks inflation, protecting savers. Recent issues were bought mostly out of bank deposits, so the cooling effect on spending is small.',
    'Italy’s BTP Italia, a retail bond indexed to Italian inflation, shows the model; France’s OATi is indexed to French consumer prices, while the Livret A rate tracks inflation only partly, being based on inflation and short-term market rates.'),
  S('microsave', 'Inflation-linked micro-savings', 'ILMSP / PIRA / MIP-IHA', 'Savings & investment', ['gov', 'biz', 'hh'], { dem: 1 }, 2, 1, 2, 'all',
    'Small-deposit, low-fee products with inflation-linked returns, with a public match for low-income savers.',
    'The pan-European personal pension product under Regulation (EU) 2019/1238 is a long-term retirement product whose default option aims to protect capital, not to track inflation, so national savings banks are the more direct delivery channel.'),
  S('pension', 'Flexible inflation-adjusted pensions', 'FIAPP', 'Savings & investment', ['gov'], { cost: 1 }, 2, 3, 2, 'all',
    'Index pension payments to inflation, with stronger protection for the smallest pensions.',
    'National competence; a large recurring cost, so weigh against debt sustainability.'),
  S('greenbond', 'Inflation-linked infrastructure and green bonds', 'IRIBI / GSBIR / INIB / SILIP', 'Savings & investment', ['gov', 'eu', 'biz'], { cost: 2, imp: 2 }, 3, 1, 2, 'all',
    'Bonds with inflation-linked returns that fund the energy, transport and logistics investments that remove supply bottlenecks.',
    'Can use the voluntary European Green Bond label under Regulation (EU) 2023/2631, in force since 21 December 2024. NextGenerationEU green bonds are an EU-level precedent, though issued under the Commission’s own ICMA-aligned framework and not inflation-linked.'),
  S('pits', 'Predictive investment taxation', 'PITS', 'Tax & fiscal design', ['gov'], { dem: 2, hou: 1 }, 3, 0, 1, 'all',
    'Raise capital-gains tax on short-term speculative gains when inflation is forecast to rise, and cut it for long-term investment in productive capacity.',
    'Direct taxation is national but must not restrict free movement of capital; apply equally to domestic and cross-border investors.'),
  S('contracts', 'Inflation-responsive public contracts', 'IRPPC / ISPPS / APWIAP', 'Tax & fiscal design', ['gov', 'local', 'biz'], { cost: 2 }, 2, 1, 2, 'all',
    'Write price-revision clauses into public works and procurement contracts so projects continue through cost spikes without disputes.',
    'Allowed by the Public Procurement Directive where review clauses are clear and set out in the original tender.'),
  S('sme', 'Low-cost finance for essential-sector SMEs', 'IFIRBL / LICS / ILCSB', 'Savings & investment', ['gov', 'biz', 'local'], { cost: 2 }, 2, 1, 2, 'all',
    'Interest-free or inflation-linked finance for small firms in food, energy and care, so higher borrowing costs are not passed into prices.',
    'Use de minimis aid limits, InvestEU guarantees or national promotional banks.'),
  S('insurance', 'Sector inflation insurance', 'SSII / CBIEE', 'Savings & investment', ['biz', 'hh', 'gov'], { cost: 2, exp: 1 }, 3, 1, 1, 'all',
    'Insurance or mutual schemes that pay out when the price of a named essential rises past a threshold.',
    'Under Directive 2009/138/EC (Solvency II) the insurer must be authorised for the relevant class, here miscellaneous financial loss, but Member States may not require prior approval of policy conditions or premiums.'),

  // Demand management
  S('dcis', 'Dynamic consumer incentives', 'DCIS / AICC / RTRD', 'Demand management', ['biz', 'gov', 'hh'], { dem: 2, cost: 1 }, 2, 1, 2, 'all',
    'Time-limited discounts and prompts that steer shoppers towards off-peak times and substitute products when demand for an item is surging.',
    'Largely private-sector led; consumer-law rules on transparent pricing and the GDPR apply.'),
  S('paycap', 'Limits on discretionary digital spending', 'NDWIM / IDPCS', 'Demand management', ['gov'], { dem: 2 }, 3, 0, -1, 'all',
    'Automatic caps on non-essential spending through digital wallets when inflation is high.',
    'A mandatory cap would restrict rights under the EU Charter of Fundamental Rights and would have to meet the necessity and proportionality test of its Article 52(1). Directive (EU) 2015/2366 provides only for spending limits agreed between payer and provider, so a voluntary self-set cap is the workable version.'),
  S('freeze', 'Temporary freeze on non-essential prices', 'DPFI / TEGPF', 'Demand management', ['gov'], { exp: 2, dem: 1 }, 1, 1, 1, 'all',
    'A short, voluntary or negotiated standstill on prices outside essentials during an inflation peak, backed by tax credits.',
    'Mandatory freezes face free-movement and competition scrutiny; negotiated, time-limited agreements are safer.'),

  // Trade
  S('tariff', 'Automatic tariff adjustment on essentials', 'AIATS / PEIBM', 'Trade', ['eu'], { imp: 3, cost: 2 }, 2, 1, 0, 'eu',
    'Suspend or lower import duties on essential goods automatically when their prices surge, and restore them afterwards.',
    'The common commercial policy is an exclusive EU competence: autonomous tariff suspensions are adopted by the Council, not by member states.'),
  S('export', 'Smart export management and import substitution', 'SECISM', 'Trade', ['eu', 'gov'], { imp: 2, cost: 2 }, 3, 1, 0, 'eu',
    'Monitor exports of critical goods during shortages and build EU capacity to replace vulnerable imports.',
    'Quantitative export restrictions between member states are prohibited (Article 35 TFEU) unless justified under Article 36. Exports to third countries are free under Regulation (EU) 2015/479, which lets the Commission impose export authorisations to prevent a shortage of essential products.'),
  S('fxwindow', 'Stable exchange rate window for essential imports', 'IMCEM / Sector FX auctions', 'Trade', ['cb', 'gov'], { imp: 3 }, 1, 2, 1, 'noneuro',
    'Give importers of food, medicines and energy access to foreign currency at a pre-set rate through periodic auctions when the currency weakens sharply.',
    'For members with their own currency. Must be open to all importers in the sector and not operate as a multiple exchange rate that restricts capital movement.'),

  // Currency stability
  S('swap', 'Exchange rate locks for importers', 'Dynamic exchange rate swaps', 'Currency stability', ['cb', 'biz'], { imp: 3 }, 1, 1, 2, 'noneuro',
    'A facility through which import-dependent firms lock an exchange rate for a year or more, giving cost certainty without moving the currency.',
    'Commercial hedging already exists; a central-bank facility for small firms carries balance-sheet risk and must be priced at market.'),
  S('hedge', 'Selective inflation hedging for exporters', 'Selective inflation hedging contracts', 'Currency stability', ['gov', 'biz'], { imp: 1, cost: 1 }, 2, 2, 1, 'all',
    'Contracts that compensate key exporters for domestic cost inflation, funded by a pool exporters pay into, so competitiveness does not depend on a weaker currency.',
    'Direct export aid is prohibited inside the EU; a self-funded mutual pool or private insurance is the lawful form.'),
  S('exportbond', 'Export-linked government bonds', 'Export-linked bond issuance', 'Capital & investment', ['gov'], { imp: 2 }, 2, 1, 2, 'all',
    'Government bonds whose coupon rises with export performance, attracting foreign capital into the economy while exports are strong.',
    'A debt-management choice; the calculator under Currency & Trade prices an example.'),
  S('sti', 'Smart trade indexing', 'Smart trade indexing', 'Currency stability', ['cb', 'gov', 'res'], { imp: 2 }, 3, 1, -1, 'noneuro',
    'Sector-specific exchange rate adjustments tied to each sector’s trade performance and productivity.',
    'Multiple exchange rates conflict with free movement of capital and IMF Article VIII. The workable version is the sector cooperation and hedging instruments below.'),
  S('symbiosis', 'Cross-sector trade symbiosis', 'Cross-sector trade symbiosis programme', 'Currency stability', ['cb', 'biz', 'gov'], { imp: 2 }, 2, 0, 2, 'noneuro',
    'Match exporters’ foreign-currency earnings directly with importers’ needs, so that large flows net out before they reach the market.',
    'A voluntary netting platform is compatible with EU law and reduces market pressure and transaction costs.'),
  S('voucher', 'Export voucher system', 'Blockchain-powered export voucher system', 'Currency stability', ['cb', 'biz'], { imp: 2 }, 3, 0, 1, 'noneuro',
    'Exporters hold part of their foreign earnings as tradable, fully backed vouchers that importers can use, smoothing conversion flows.',
    'Must be voluntary: compulsory surrender or retention of export earnings would restrict capital movements. See the calculator under Currency & Trade.'),
  S('corridor', 'Regional currency agreements for trade corridors', 'Regional currency agreements', 'Currency stability', ['cb', 'eu'], { imp: 2 }, 3, 0, 1, 'noneuro',
    'Neighbouring central banks stabilise the exchange rate for trade along a shared corridor and encourage invoicing in local currencies.',
    'ERM II is the EU’s own arrangement; Denmark, its only current participant, keeps the krone within a narrow ±2.25% band. ECB swap lines with Denmark and Sweden and the EUREP repo facility provide backstop euro liquidity, not an exchange-rate commitment.'),
  S('pool', 'Currency basket pool', 'Blockchain-based currency pools', 'Currency stability', ['cb', 'eu', 'res'], { imp: 2 }, 3, 0, 1, 'noneuro',
    'A settlement unit built from a weighted basket of regional currencies, which is steadier than any one member.',
    'The pre-euro ECU was such a basket. The Currency & Trade page measures how much volatility a basket removes, using live rates.'),
  S('swf', 'Stabilisation fund', 'Sovereign wealth fund for exchange rate stabilisation', 'Currency stability', ['gov', 'cb'], { imp: 2, cost: 1 }, 3, 2, 2, 'all',
    'Save windfall revenues in foreign assets during good years and draw on them to steady the currency or the budget in bad years.',
    'Compatible with EU fiscal rules: buying financial assets for a fund does not add to the deficit.'),
  S('spectax', 'Tax on currency speculation', 'Tax on currency speculation', 'Currency stability', ['gov', 'eu'], { imp: 1 }, 3, 0, 0, 'eu',
    'A small tax on very short-term currency trades, with the revenue set aside for stabilisation.',
    'An EU financial transaction tax was proposed under enhanced cooperation in 2013 but never agreed, and the Commission said in its 2026 work programme that it intends to withdraw it. That proposal left spot currency trades untaxed; unilateral versions risk breaching free movement of capital.'),
  S('citizenhedge', 'Citizen currency-hedging bonds', 'Citizen-owned currency hedging programmes', 'Currency stability', ['gov', 'hh'], { imp: 1, dem: 1 }, 2, 1, 2, 'noneuro',
    'Retail government bonds indexed to the euro, so households can protect their savings without moving money abroad.',
    'Hungary and Romania already issue euro-denominated retail bonds.'),
  S('ratefx', 'Trade-linked interest rate rule', 'Dynamic interest rate mechanism tied to external trade', 'Currency stability', ['cb', 'res'], { imp: 2, dem: 1 }, 2, 0, 1, 'noneuro',
    'Let the external balance inform interest rate decisions in a transparent, rule-like way.',
    'Central banks are independent and bound to price stability as the primary objective; the trade balance can be an input, not the target.'),

  // Capital & investment
  S('fdi', 'Dynamic tax incentives for long-term investors', 'Dynamic tax incentives / import-substitution credits', 'Capital & investment', ['gov'], { imp: 2, cost: 1 }, 3, 2, 1, 'all',
    'Tax relief that grows the longer an investor stays and reinvests, with a premium for projects that replace vulnerable imports.',
    'Must respect State-aid rules and the 15% global minimum tax (Directive (EU) 2022/2523); qualifying refundable credits are the preferred design.'),
  S('ppp', 'Public–private partnership bonds', 'Public–private partnership bonds', 'Capital & investment', ['gov', 'biz'], { cost: 1, imp: 1 }, 3, 1, 2, 'all',
    'Bonds issued jointly with leading firms to fund strategic infrastructure, sharing risk and return.',
    'Eurostat rules decide whether the debt sits on the government balance sheet; InvestEU can guarantee part.'),
  S('tourism', 'Tourism-linked investment bonds', 'Tourism-linked foreign investment bonds', 'Capital & investment', ['gov', 'local'], { imp: 1 }, 2, 1, 2, 'all',
    'Bonds whose return follows tourism revenue, bringing outside capital into a sector that earns foreign income.',
    'Most relevant for members where travel receipts are large, such as Croatia, Greece, Cyprus, Malta, Portugal and Spain.'),
  S('swap2', 'Debt-for-growth infrastructure swaps', 'Debt-for-growth infrastructure swaps', 'Capital & investment', ['gov', 'eu'], { imp: 1, cost: 1 }, 3, 0, 1, 'all',
    'Finance infrastructure through long concessions and revenue rights instead of new borrowing.',
    'Concessions fall under Directive 2014/23/EU. Foreign investment in critical assets is screened by member states under Regulation (EU) 2019/452, which Regulation (EU) 2026/1386 replaces from 17 January 2028.'),
  S('token', 'Tokenised investment in national assets', 'National blockchain ecosystem / wealth-backed tokens', 'Capital & investment', ['gov', 'biz'], { imp: 1 }, 3, 0, 1, 'all',
    'Regulated digital securities that let investors buy small shares of infrastructure and other real assets.',
    'Tokenised securities are financial instruments under Directive 2014/65/EU and can be issued and traded under the DLT Pilot Regime (Regulation (EU) 2022/858). MiCA (Regulation (EU) 2023/1114) does not apply to crypto-assets that qualify as financial instruments.'),
  S('exportcredit', 'Performance-based export support and insurance', 'Export credit systems / export insurance', 'Capital & investment', ['gov', 'biz'], { imp: 2 }, 2, 1, 1, 'all',
    'Reward and insure exporters according to results in markets outside the EU.',
    'Export aid for trade inside the EU is prohibited; short-term export-credit insurance for marketable risks must be left to the private market.'),

  // Coordination
  S('board', 'National inflation advisory board', 'NIMAB / PPIRC', 'Coordination', ['gov', 'cb', 'res', 'biz'], { exp: 2, dem: 1, cost: 1 }, 2, 0, 2, 'all',
    'A standing panel of economists, statisticians and industry experts that reads the data continuously and advises on targeted, sector-level action.',
    'Every member state must have an independent fiscal institution (Directive 2011/85/EU as amended by Directive (EU) 2024/1265), and 20 have a national productivity board; either could host it. Bulgaria, Czechia, Estonia, Hungary, Poland, Romania and Sweden have no productivity board.'),
  S('hybrid', 'National–regional inflation response', 'HNLICI / RIRTF / RIBF / MICF / DIBS', 'Coordination', ['gov', 'local', 'eu'], { cost: 2, hou: 1, dem: 1 }, 2, 2, 1, 'all',
    'Pair economy-wide policy with regional task forces and buffer funds that respond to local price shocks quickly.',
    'Cohesion policy funds are programmed for investment under the policy objectives of Regulation (EU) 2021/1060. Programmes can be amended, and Article 20 allows temporary measures once the Council recognises exceptional circumstances; the Regulation does not set up regional buffer funds.')
];

// The official source behind each EU note, and the date the notes were last checked against them.
export const REVIEWED = '6 October 2026';
export const REVIEWED_ISO = '2026-10-06';
// The EU document number (CELEX) behind an official address, without any consolidation date,
// e.g. '32014R0651'. Empty for sources that are not EU legal acts.
export function celexOf(url) {
  let m = /CELEX:([^&]+)/.exec(url || '');
  let id = m ? decodeURIComponent(m[1]) : '';
  if (!id) {
    m = /\/eli\/(reg|dir|dec)\/(\d{4})\/(\d+)\//.exec(url || '');
    if (m) id = '3' + m[2] + { reg: 'R', dir: 'L', dec: 'D' }[m[1]] + ('000' + m[3]).slice(-4);
  }
  return /^0\d{4}[A-Z]\d{4}-/.test(id) ? '3' + id.slice(1, 10) : id;
}
export const SOURCES = {
 "ews": [
  "Eurostat HICP reference metadata",
  "https://ec.europa.eu/eurostat/cache/metadata/en/prc_hicp_esms.htm"
 ],
 "supplyai": [
  "Regulation (EU) 2024/1252 (Critical Raw Materials Act), Article 20",
  "https://eur-lex.europa.eu/eli/reg/2024/1252/oj"
 ],
 "hybridcpi": [
  "Eurostat HICP reference metadata",
  "https://ec.europa.eu/eurostat/cache/metadata/en/prc_hicp_esms.htm"
 ],
 "localidx": [
  "Eurostat HICP reference metadata",
  "https://ec.europa.eu/eurostat/cache/metadata/en/prc_hicp_esms.htm"
 ],
 "pricewatch": [
  "Bundeskartellamt, Market Transparency Unit for Fuels",
  "https://www.bundeskartellamt.de/DE/Aufgaben/MarkttransparenzstelleFuerKraftstoffe/markttransparenzstellefuerkraftstoffe_node.html"
 ],
 "ledger": [
  "Commission Guidelines on horizontal co-operation agreements (2023/C 259/01)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52023XC0721(01)"
 ],
 "confidence": [
  "ECB Consumer Expectations Survey",
  "https://www.ecb.europa.eu/stats/ecb_surveys/consumer_exp_survey/html/index.en.html"
 ],
 "healthmap": [
  "ECB Household Finance and Consumption Survey",
  "https://www.ecb.europa.eu/stats/ecb_surveys/hfcs/html/index.en.html"
 ],
 "varvat": [
  "Directive (EU) 2022/542",
  "https://eur-lex.europa.eu/eli/dir/2022/542/oj"
 ],
 "smartsub": [
  "Regulation (EU) 2024/1263",
  "https://eur-lex.europa.eu/eli/reg/2024/1263/oj"
 ],
 "pricecap": [
  "Judgment in Case C-557/23 SPAR Magyarország",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62023CJ0557"
 ],
 "ciap": [
  "French Government: retailers commit to a 'trimestre anti-inflation'",
  "https://www.info.gouv.fr/actualite/la-grande-distribution-sengage-a-mettre-en-place-un-trimestre-anti-inflation"
 ],
 "watchdog": [
  "Regulation (EU) 2017/2394 (Consumer Protection Cooperation)",
  "https://eur-lex.europa.eu/eli/reg/2017/2394/oj"
 ],
 "coopprice": [
  "Commission Guidelines on horizontal co-operation agreements (2023/C 259/01)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52023XC0721(01)"
 ],
 "market": [
  "Regulation (EU) 2021/1057 (ESF+)",
  "https://eur-lex.europa.eu/eli/reg/2021/1057/oj"
 ],
 "retailfc": [
  "About the Enterprise Europe Network",
  "https://een.ec.europa.eu/about-enterprise-europe-network"
 ],
 "relief": [
  "ECB monetary policy statement, 27 October 2022",
  "https://www.ecb.europa.eu/press/press_conference/monetary-policy-statement/2022/html/ecb.is221027~358a06a35f.en.html"
 ],
 "tiered": [
  "Article 153 TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E153"
 ],
 "taxrelief": [
  "European Commission, Report on Public Finances in EMU 2024, section II.3.5",
  "https://economy-finance.ec.europa.eu/document/download/0f07e7a4-1355-46c6-998d-eab45b855a70_en?filename=ip325_en.pdf"
 ],
 "literacy": [
  "Commission and OECD-INFE joint financial competence framework for adults",
  "https://finance.ec.europa.eu/publications/commission-and-oecd-infe-publish-joint-framework-adults-improve-individuals-financial-skills_en"
 ],
 "debt": [
  "Directive 2014/17/EU (Mortgage Credit Directive), Article 28",
  "https://eur-lex.europa.eu/eli/dir/2014/17/oj"
 ],
 "health": [
  "Article 168(7) TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E168"
 ],
 "reserves": [
  "Council Directive 2009/119/EC, Article 3",
  "https://eur-lex.europa.eu/eli/dir/2009/119/oj"
 ],
 "eupool": [
  "European Commission: EU Energy and Raw Materials Platform",
  "https://energy.ec.europa.eu/topics/energy-security/eu-energy-and-raw-materials-platform_en"
 ],
 "dssip": [
  "Clean Industrial Deal State Aid Framework (C/2025/3602)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025XC03602"
 ],
 "agri": [
  "Regulation (EU) 2021/2116, Article 16",
  "https://eur-lex.europa.eu/eli/reg/2021/2116/oj"
 ],
 "localsupply": [
  "A Vision for Agriculture and Food, COM(2025) 75",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC0075"
 ],
 "circular": [
  "Regulation (EU) 2024/1252, Article 5",
  "https://eur-lex.europa.eu/eli/reg/2024/1252/oj"
 ],
 "utility": [
  "Directive (EU) 2019/944 as amended by Directive (EU) 2024/1711, Articles 5 and 66a",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019L0944-20240716"
 ],
 "energycredit": [
  "Directive (EU) 2023/1791, Article 8; Regulation (EU) 2022/1369, Article 3",
  "https://eur-lex.europa.eu/eli/dir/2023/1791/oj"
 ],
 "energycoop": [
  "Directive (EU) 2018/2001, Article 22; Directive (EU) 2019/944, Article 16",
  "https://eur-lex.europa.eu/eli/dir/2018/2001/oj"
 ],
 "pricelock": [
  "Directive (EU) 2019/944 as amended by Directive (EU) 2024/1711, Article 11",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02019L0944-20240716"
 ],
 "rentindex": [
  "La Moncloa, Council of Ministers 27 December 2022",
  "https://www.lamoncloa.gob.es/lang/en/gobierno/councilministers/paginas/2022/20221227_council.aspx"
 ],
 "rentaid": [
  "European Affordable Housing Plan, COM(2025) 1025",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC1025"
 ],
 "housingfund": [
  "European Affordable Housing Plan, COM(2025) 1025",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC1025"
 ],
 "mobility": [
  "Regulation (EC) No 883/2004, Article 13",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02004R0883-20190731"
 ],
 "wageplatform": [
  "TFEU, Article 153(5)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E153"
 ],
 "skills": [
  "European Commission, Pact for Skills",
  "https://employment-social-affairs.ec.europa.eu/policies-and-activities/skills-and-qualifications/working-together/pact-skills_en"
 ],
 "transit": [
  "La Moncloa, new public transport tariffs from 1 July 2025",
  "https://www.lamoncloa.gob.es/lang/en/gobierno/news/paginas/2025/20250612-transport-new-tariffs.aspx"
 ],
 "bonds": [
  "Italian Treasury (MEF), BTP Italia",
  "https://www.dt.mef.gov.it/en/debito_pubblico/titoli_di_stato/quali_sono_titoli/btp_italia/"
 ],
 "microsave": [
  "Regulation (EU) 2019/1238, Articles 2 and 45",
  "https://eur-lex.europa.eu/eli/reg/2019/1238/oj"
 ],
 "pension": [
  "TFEU, Article 153(4)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E153"
 ],
 "greenbond": [
  "European Commission, NextGenerationEU Green Bonds",
  "https://commission.europa.eu/strategy-and-policy/eu-budget/eu-borrower-investor-relations/nextgenerationeu-green-bonds_en"
 ],
 "pits": [
  "TFEU, Article 63",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E063"
 ],
 "contracts": [
  "Directive 2014/24/EU, Article 72(1)(a)",
  "https://eur-lex.europa.eu/eli/dir/2014/24/oj"
 ],
 "sme": [
  "Regulation (EU) 2023/2831",
  "https://eur-lex.europa.eu/eli/reg/2023/2831/oj"
 ],
 "insurance": [
  "Directive 2009/138/EC, Articles 14, 15 and 21",
  "https://eur-lex.europa.eu/eli/dir/2009/138/oj"
 ],
 "dcis": [
  "Directive (EU) 2019/2161 (amending Directive 98/6/EC)",
  "https://eur-lex.europa.eu/eli/dir/2019/2161/oj"
 ],
 "paycap": [
  "Directive (EU) 2015/2366, Article 68(1)",
  "https://eur-lex.europa.eu/eli/dir/2015/2366/oj"
 ],
 "freeze": [
  "Article 34 TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E034"
 ],
 "tariff": [
  "Article 31 TFEU (with Article 3(1)(e) TFEU)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E031"
 ],
 "export": [
  "Regulation (EU) 2015/479",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015R0479"
 ],
 "fxwindow": [
  "IMF Articles of Agreement, Article VIII, Section 3",
  "https://www.imf.org/external/pubs/ft/aa/index.htm"
 ],
 "swap": [
  "Article 107 TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E107"
 ],
 "hedge": [
  "Regulation (EU) 2023/2831 (de minimis), Article 1(1)(e)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R2831"
 ],
 "sti": [
  "IMF Articles of Agreement, Article VIII, Section 3",
  "https://www.imf.org/external/pubs/ft/aa/index.htm"
 ],
 "symbiosis": [
  "Article 63 TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E063"
 ],
 "voucher": [
  "Article 63 TFEU",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:12016E063"
 ],
 "corridor": [
  "European Commission: ERM II – the EU's Exchange Rate Mechanism",
  "https://economy-finance.ec.europa.eu/euro/enlargement-euro-area/adoption-fixed-euro-conversion-rate/erm-ii-eus-exchange-rate-mechanism_en"
 ],
 "pool": [
  "Eurostat glossary: European currency unit (ECU)",
  "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:European_currency_unit_(ECU)"
 ],
 "swf": [
  "Eurostat: Government finance statistics methodology (ESA 2010)",
  "https://ec.europa.eu/eurostat/web/government-finance-statistics/methodology"
 ],
 "spectax": [
  "European Commission: Taxation of the financial sector",
  "https://taxation-customs.ec.europa.eu/financial-transaction-tax_en"
 ],
 "citizenhedge": [
  "Romanian Ministry of Finance: Fidelis government securities",
  "https://mfinante.gov.ro/en/web/trezor/titluri-de-stat-pentru-populatie/titluri-de-stat-fidelis"
 ],
 "ratefx": [
  "ECB Convergence Report, June 2026",
  "https://www.ecb.europa.eu/press/other-publications/convergence/html/ecb.cr202606~30e75ae1c2.en.html"
 ],
 "fdi": [
  "Directive (EU) 2022/2523",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2523"
 ],
 "ppp": [
  "Regulation (EU) 2021/523 (InvestEU)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021R0523"
 ],
 "tourism": [
  "Eurostat: Tourism statistics",
  "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Tourism_statistics"
 ],
 "swap2": [
  "Regulation (EU) 2026/1386",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32026R1386"
 ],
 "token": [
  "Regulation (EU) 2023/1114 (MiCA), Article 2(4)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114"
 ],
 "exportcredit": [
  "Commission Communication on short-term export-credit insurance (2021/C 497/02)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021XC1210(01)"
 ],
 "board": [
  "European Commission: National Productivity Boards",
  "https://economy-finance.ec.europa.eu/economic-governance-framework/what-economic-governance-framework/evolution-eu-economic-governance/national-productivity-boards_en"
 ],
 "hybrid": [
  "Regulation (EU) 2021/1060 (Common Provisions Regulation)",
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32021R1060"
 ]
};
STRATEGIES.forEach(function (x) { x.src = SOURCES[x.id] || null; });

// Document numbers of every EU regulation or directive named in a note's own text, e.g.
// 'Regulation (EU) No 651/2014' -> '32014R0651', 'Directive (EU) 2022/542' -> '32022L0542'.
export function actsIn(text) {
  const out = [], re = /(Regulation|Directive) \((?:EU|EC|EEC)\) (?:No )?(\d+)\/(\d+)/g;
  let m;
  while ((m = re.exec(text || ''))) {
    const a = m[2], b = m[3], year = a.length === 4 && +a > 1950 ? a : b, num = year === a ? b : a;
    const id = '3' + year + (m[1] === 'Regulation' ? 'R' : 'L') + ('000' + num).slice(-4);
    if (out.indexOf(id) < 0) out.push(id);
  }
  // older directives are written the other way round: 'Directive 2009/119/EC'
  const old = /Directive (\d{4})\/(\d+)\/(?:EC|EU|EEC)/g;
  while ((m = old.exec(text || ''))) { const id = '3' + m[1] + 'L' + ('000' + m[2]).slice(-4); if (out.indexOf(id) < 0) out.push(id); }
  return out;
}

export const CATEGORIES = STRATEGIES.reduce(function (a, s) { if (a.indexOf(s.cat) < 0) a.push(s.cat); return a; }, []);

export function applies(s, meta) {
  if (s.scope === 'noneuro') return !!(meta && !meta.euro && !meta.agg);
  return true;
}

// Rank strategies for a diagnosis. Returns [{ s, score, why }], best first.
export function recommend(diag, meta, role) {
  const p = diag.p;
  return STRATEGIES.map(function (s) {
    let raw = 0, best = null, bestV = 0;
    Object.keys(s.fit).forEach(function (k) {
      const v = (p[k] || 0) / 100 * s.fit[k];
      raw += v;
      if (v > bestV) { bestV = v; best = k; }
    });
    let score = raw * (0.6 + 0.2 * s.feas) * (1.1 - 0.1 * s.speed); // feas -1 (not workable as proposed) scores lowest
    if (!applies(s, meta)) score = 0;
    if (role && role !== 'all' && s.who.indexOf(role) < 0) score *= 0.35;
    return { s: s, score: score, why: best };
  }).sort(function (a, b) { return b.score - a.score; });
}
