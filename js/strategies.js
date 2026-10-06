// Strategy library. Each entry is a policy or market design option, described
// for the EU setting with its legal and institutional fit.
// fit: how strongly it addresses each pressure (0-3). speed: 1 = weeks, 2 = months, 3 = years.
// fisc: budget cost 0 none .. 3 high. feas: 2 = usable within current EU rules,
// 1 = needs careful legal design, 0 = needs EU-level agreement or Treaty-level change.
// scope: all | noneuro (members with their own currency) | eu (Union or euro-area level).
function S(id, n, ac, cat, who, fit, speed, fisc, feas, scope, d, eu) {
  return { id: id, n: n, ac: ac, cat: cat, who: who, fit: fit, speed: speed, fisc: fisc, feas: feas, scope: scope, d: d, eu: eu };
}

export const ROLES = [
  { k: 'all', n: 'All stakeholders' }, { k: 'gov', n: 'National government' }, { k: 'cb', n: 'Central bank' },
  { k: 'eu', n: 'EU institutions' }, { k: 'local', n: 'Regional & local authorities' },
  { k: 'biz', n: 'Business' }, { k: 'hh', n: 'Households & civil society' }, { k: 'res', n: 'Economists & researchers' }
];

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
    'Budget-neutral by design, which helps under the EU net-expenditure rule. State-aid notification applies to producer subsidies.'),
  S('pricecap', 'Smart, temporary price caps on essentials', 'SDPC / FEPAS / AECPCP', 'Essentials & prices', ['gov'], { cost: 3, exp: 2 }, 1, 2, 1, 'all',
    'Automatic, time-limited ceilings on a short list of essentials when prices spike, with compensation that keeps suppliers selling.',
    'Possible if non-discriminatory and proportionate under free-movement case law; caps below cost have been struck down. Use sparingly and with sunset dates.'),
  S('ciap', 'Fair-pricing certification and incentives', 'CIAP / SRBC / GBISP', 'Essentials & prices', ['gov', 'biz', 'local'], { cost: 2, exp: 2, dem: 1 }, 2, 1, 2, 'all',
    'Voluntary agreements in which firms limit price rises on essentials in return for a public fair-pricing label, tax relief or lighter fees.',
    'France and Greece have run voluntary anti-inflation baskets. Agreements must be open to all and not coordinate prices between competitors.'),
  S('watchdog', 'Consumer protection coalition', 'ILCPC / LIWG', 'Essentials & prices', ['gov', 'local', 'hh'], { cost: 2, exp: 2 }, 2, 0, 2, 'all',
    'Regulators, consumer bodies and local volunteers monitor essentials for unjustified price rises and refer cases for investigation.',
    'Fits the Consumer Protection Cooperation network and national competition authorities’ sector inquiries.'),
  S('coopprice', 'Essential goods purchasing cooperatives', 'EGCPP / AICF', 'Essentials & prices', ['biz', 'local', 'hh'], { cost: 2, imp: 1 }, 2, 0, 2, 'all',
    'Small retailers and producers pool purchases of essentials and inputs to win bulk prices and hold shared emergency stocks.',
    'Cooperatives are well established in EU law; joint purchasing is allowed below market-share thresholds in the horizontal guidelines.'),
  S('market', 'Inflation-adaptive community markets', 'IACM / LEIBZ', 'Essentials & prices', ['local'], { cost: 2, hou: 1 }, 2, 2, 2, 'all',
    'Municipal markets and designated districts where essentials are sold at stabilised prices, with the subsidy scaled to local inflation.',
    'A local competence; fund from cohesion or social budgets and target by need.'),
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
    'Several members index brackets automatically; costs revenue and counts under the expenditure rule as a discretionary revenue measure.'),
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
    'Oil stocks of 90 days are already mandatory (Directive 2009/119/EC); gas storage targets and rescEU medical stocks are precedents.'),
  S('eupool', 'European inflation cooperative', 'GIC', 'Supply & reserves', ['eu', 'gov'], { cost: 2, imp: 3 }, 3, 2, 0, 'eu',
    'Member states pool reserves of essential commodities and buy jointly, so a member under price pressure can draw at stabilised prices.',
    'Joint gas purchasing (AggregateEU) and joint vaccine procurement show the model; a permanent pool needs a Council decision.'),
  S('dssip', 'Dynamic supply-side incentives', 'DSSIP / REIP / RCPS', 'Supply & reserves', ['gov', 'eu'], { cost: 2, dem: 2 }, 3, 2, 1, 'all',
    'Tax credits that grow during inflation spikes for firms that expand output of essentials or cut their energy and material use.',
    'State aid: use the General Block Exemption Regulation or the Clean Industrial Deal framework.'),
  S('agri', 'Inflation-linked agricultural expansion', 'ILA-EG / RTAPSM / DAN', 'Supply & reserves', ['gov', 'eu', 'local'], { cost: 3 }, 3, 2, 1, 'all',
    'Grants and storage support that switch on when food inflation passes a threshold, helping farmers raise output of the crops in shortest supply.',
    'Must be designed inside the Common Agricultural Policy and its crisis reserve.'),
  S('localsupply', 'Local supply-chain and food networks', 'LSCEP / LFSN / LRAN / UVFIR', 'Supply & reserves', ['local', 'biz', 'gov'], { cost: 2, imp: 3 }, 3, 1, 2, 'all',
    'Shorten supply chains: regional producer networks, shared storage, urban farming and local sourcing of inputs that are now imported.',
    'Supported by cohesion funds and the farm-to-fork agenda; public buyers may not discriminate by origin but can set freshness and sustainability criteria.'),
  S('circular', 'Circular-economy cost reduction', 'CEIRI / ZWPG / SPIC', 'Supply & reserves', ['biz', 'gov', 'eu'], { cost: 2, imp: 2 }, 3, 1, 2, 'all',
    'Incentives for recycled inputs and zero-waste production, lowering dependence on scarce imported raw materials.',
    'Aligned with the Circular Economy Action Plan and Critical Raw Materials Act recycling targets.'),
  S('logistics', 'Predictive logistics and distribution', 'APSCO / IRRDN', 'Supply & reserves', ['biz', 'gov', 'local'], { cost: 2, imp: 1 }, 2, 1, 2, 'all',
    'Forecast bottlenecks and pre-position stocks where demand will surge, so shortages do not turn into price spikes.',
    'Private-sector led, with public data from customs and transport systems.'),

  // Energy
  S('utility', 'Dynamic utility price stabilisation', 'DUPS / ICUP / ESSF', 'Energy', ['gov', 'local'], { cost: 3, exp: 1 }, 1, 3, 1, 'all',
    'Cap the pass-through of energy and water cost spikes to household bills for a limited time, compensating providers, with priority for vulnerable users.',
    'Regulated retail prices for vulnerable and, in a declared crisis, wider groups are allowed under the 2024 electricity market reform.'),
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
    'Free movement makes this easy within the EU; cohesion policy can co-fund regional hubs.'),

  // Wages & work
  S('wageplatform', 'Predictive wage adjustment', 'PWAP / IPEC / DPSWAP', 'Wages & work', ['gov', 'biz'], { wage: 2, dem: 1 }, 2, 1, 1, 'all',
    'Agree pay rises that follow forecast inflation in small, regular steps rather than large catch-up settlements after the event.',
    'Wage setting belongs to social partners. Forward-looking, partial indexation limits second-round effects; full backward indexation entrenches inflation.'),
  S('skills', 'Adaptive workforce development grants', 'AWDG', 'Wages & work', ['gov', 'eu', 'biz'], { wage: 3, dem: 1 }, 3, 2, 2, 'all',
    'Fund fast retraining into occupations with shortages, so that scarce skills do not drive pay and prices up.',
    'Eligible under the European Social Fund Plus and the Pact for Skills.'),
  S('transit', 'Adaptive public transport pricing', 'APT-PM / FPTSS / AILTS', 'Wages & work', ['local', 'gov'], { cost: 2 }, 1, 2, 2, 'all',
    'Hold or cut public transport fares automatically when fuel and living costs surge, compensating operators.',
    'Germany’s flat-rate ticket and Spain’s free regional rail are precedents; compensation follows the public service obligation rules.'),

  // Savings & investment
  S('bonds', 'Inflation-protected retail savings', 'IPSB / UISB / IARSB / CCIHA', 'Savings & investment', ['gov', 'cb'], { dem: 3, exp: 2 }, 2, 1, 2, 'all',
    'Government savings bonds and accounts for households whose return tracks inflation, protecting savers and drawing spending out of an overheated economy.',
    'Italy’s BTP Italia and France’s Livret A and OATi show the model.'),
  S('microsave', 'Inflation-linked micro-savings', 'ILMSP / PIRA / MIP-IHA', 'Savings & investment', ['gov', 'biz', 'hh'], { dem: 2 }, 2, 1, 2, 'all',
    'Small-deposit, low-fee products with inflation-linked returns, with a public match for low-income savers.',
    'Could be delivered through the pan-European personal pension product and national savings banks.'),
  S('pension', 'Flexible inflation-adjusted pensions', 'FIAPP', 'Savings & investment', ['gov'], { cost: 1 }, 2, 3, 2, 'all',
    'Index pension payments to inflation, with stronger protection for the smallest pensions.',
    'National competence; a large recurring cost, so weigh against debt sustainability.'),
  S('greenbond', 'Inflation-linked infrastructure and green bonds', 'IRIBI / GSBIR / INIB / SILIP', 'Savings & investment', ['gov', 'eu', 'biz'], { cost: 2, imp: 2 }, 3, 1, 2, 'all',
    'Bonds with inflation-linked returns that fund the energy, transport and logistics investments that remove supply bottlenecks.',
    'Can be issued under the European Green Bond Standard; EU-level issuance follows the NextGenerationEU precedent.'),
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
    'A new product class; needs supervisory approval under Solvency II.'),

  // Demand management
  S('dcis', 'Dynamic consumer incentives', 'DCIS / AICC / RTRD', 'Demand management', ['biz', 'gov', 'hh'], { dem: 2, cost: 1 }, 2, 1, 2, 'all',
    'Time-limited discounts and prompts that steer shoppers towards off-peak times and substitute products when demand for an item is surging.',
    'Largely private-sector led; consumer-law rules on transparent pricing and the GDPR apply.'),
  S('paycap', 'Limits on discretionary digital spending', 'NDWIM / IDPCS', 'Demand management', ['gov'], { dem: 2 }, 3, 0, 0, 'all',
    'Automatic caps on non-essential spending through digital wallets when inflation is high.',
    'Not compatible with EU fundamental rights and payment-services law as a mandatory measure. Listed for completeness; a voluntary self-set budget cap is the workable version.'),
  S('freeze', 'Temporary freeze on non-essential prices', 'DPFI / TEGPF', 'Demand management', ['gov'], { exp: 2, dem: 1 }, 1, 1, 1, 'all',
    'A short, voluntary or negotiated standstill on prices outside essentials during an inflation peak, backed by tax credits.',
    'Mandatory freezes face free-movement and competition scrutiny; negotiated, time-limited agreements are safer.'),

  // Trade
  S('tariff', 'Automatic tariff adjustment on essentials', 'AIATS / PEIBM', 'Trade', ['eu'], { imp: 3, cost: 2 }, 2, 1, 0, 'eu',
    'Suspend or lower import duties on essential goods automatically when their prices surge, and restore them afterwards.',
    'The common commercial policy is an exclusive EU competence: autonomous tariff suspensions are adopted by the Council, not by member states.'),
  S('export', 'Smart export management and import substitution', 'SECISM', 'Trade', ['eu', 'gov'], { imp: 2, cost: 2 }, 3, 1, 0, 'eu',
    'Monitor exports of critical goods during shortages and build EU capacity to replace vulnerable imports.',
    'Export restrictions between member states are prohibited (Article 35 TFEU); towards third countries only the EU can act. Import substitution runs through industrial policy instead.'),
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
  S('sti', 'Smart trade indexing', 'Smart trade indexing', 'Currency stability', ['cb', 'gov', 'res'], { imp: 2 }, 3, 1, 0, 'noneuro',
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
    'ERM II is the EU’s own arrangement; Denmark’s narrow band is the working example. Swap lines with the ECB play a similar role.'),
  S('pool', 'Currency basket pool', 'Blockchain-based currency pools', 'Currency stability', ['cb', 'eu', 'res'], { imp: 2 }, 3, 0, 1, 'noneuro',
    'A settlement unit built from a weighted basket of regional currencies, which is steadier than any one member.',
    'The pre-euro ECU was such a basket. The Currency & Trade page measures how much volatility a basket removes, using live rates.'),
  S('swf', 'Stabilisation fund', 'Sovereign wealth fund for exchange rate stabilisation', 'Currency stability', ['gov', 'cb'], { imp: 2, cost: 1 }, 3, 2, 2, 'all',
    'Save windfall revenues in foreign assets during good years and draw on them to steady the currency or the budget in bad years.',
    'Compatible with EU fiscal rules: buying financial assets for a fund does not add to the deficit.'),
  S('spectax', 'Tax on currency speculation', 'Tax on currency speculation', 'Currency stability', ['gov', 'eu'], { imp: 1 }, 3, 0, 0, 'eu',
    'A small tax on very short-term currency trades, with the revenue set aside for stabilisation.',
    'A financial transaction tax has been discussed under enhanced cooperation since 2013 without agreement; unilateral versions risk breaching free movement of capital.'),
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
    'Concessions fall under Directive 2014/23/EU; foreign investment in critical assets is screened under the FDI Screening Regulation.'),
  S('token', 'Tokenised investment in national assets', 'National blockchain ecosystem / wealth-backed tokens', 'Capital & investment', ['gov', 'biz'], { imp: 1 }, 3, 0, 1, 'all',
    'Regulated digital securities that let investors buy small shares of infrastructure and other real assets.',
    'Use the DLT Pilot Regime and MiCA; the regulatory-sandbox idea in the source framework maps directly to these.'),
  S('exportcredit', 'Performance-based export support and insurance', 'Export credit systems / export insurance', 'Capital & investment', ['gov', 'biz'], { imp: 2 }, 2, 1, 1, 'all',
    'Reward and insure exporters according to results in markets outside the EU.',
    'Export aid for trade inside the EU is prohibited; short-term export-credit insurance for marketable risks must be left to the private market.'),

  // Coordination
  S('board', 'National inflation advisory board', 'NIMAB / PPIRC', 'Coordination', ['gov', 'cb', 'res', 'biz'], { exp: 2, dem: 1, cost: 1 }, 2, 0, 2, 'all',
    'A standing panel of economists, statisticians and industry experts that reads the data continuously and advises on targeted, sector-level action.',
    'National productivity boards and independent fiscal institutions already exist in every member and could host it.'),
  S('hybrid', 'National–regional inflation response', 'HNLICI / RIRTF / RIBF / MICF / DIBS', 'Coordination', ['gov', 'local', 'eu'], { cost: 2, hou: 1, dem: 1 }, 2, 2, 2, 'all',
    'Pair economy-wide policy with regional task forces and buffer funds that respond to local price shocks quickly.',
    'Cohesion policy and its flexibility instruments can finance regional buffers.')
];

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
    let score = raw * (0.6 + 0.2 * s.feas) * (1.1 - 0.1 * s.speed);
    if (!applies(s, meta)) score = 0;
    if (role && role !== 'all' && s.who.indexOf(role) < 0) score *= 0.35;
    return { s: s, score: score, why: best };
  }).sort(function (a, b) { return b.score - a.score; });
}
