// Method, install and about views of the Data & Method page.
function table(head, rows) {
  return '<div class="tw"><table><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}

const GAUGES = [
  ['Demand-pull', '40% core inflation (2 → 6%), 25% services inflation (2.5 → 7%), 20% real GDP growth (1 → 4%), 15% unemployment below its five-year average (0 → 2 points)'],
  ['Cost-push', '40% energy inflation (2 → 20%), 30% producer prices (2 → 15%), 30% food inflation (2 → 10%)'],
  ['Imported & exchange-rate', '35% twelve-month currency depreciation (0 → 10%), 35% energy import dependency (30 → 90%) × energy inflation, 30% import share of GDP (30 → 90%) × producer prices'],
  ['Wage–price', '60% wage growth above 3% (0 → 6 points), 40% services inflation (2.5 → 7%)'],
  ['Housing', '50% rent inflation (2 → 8%), 50% house price growth (3 → 12%)'],
  ['Expectations', 'Consumer price-expectation balance, in standard deviations above its own average since 2015 (0 → 2)']
];

function mirrors(el) {
  fetch('mirrors.json').then(function (r) { return r.json(); }).then(function (list) {
    el.innerHTML = '<ul class="mirrors">' + list.map(function (m, i) {
      return '<li><span><b>' + m.name + '</b><br><a href="' + m.url + '" target="_blank" rel="noopener">' + m.url.replace(/^https:\/\//, '') + '</a></span><span class="badge b-mute" id="mir' + i + '">Checking</span></li>';
    }).join('') + '</ul>';
    list.forEach(function (m, i) {
      fetch(m.url + 'version.json?' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).then(function () { return true; }, function () { return false; }).then(function (ok) {
        const b = document.getElementById('mir' + i);
        if (b) { b.textContent = ok ? 'Reachable' : 'Not reachable'; b.className = 'badge b-' + (ok ? 'good' : 'warn'); }
      });
    });
  }).catch(function () { el.innerHTML = '<p class="note">The address list is available when you are online.</p>'; });
}

export function PAGE_METHOD(sub, x) {
  const card = x.card;
  if (sub === 'how') {
    return card('Official data and estimates are kept apart', '<p>Everything labelled with a source is an official statistic, shown exactly as published by Eurostat or the European Central Bank. Three things in this tool are <b>calculated</b> from those statistics: the pressure gauges, the six-month projection and the policy simulator. They are transparent rules of thumb intended to structure a discussion and compare options. They are not forecasts and do not replace the models and judgement of finance ministries, central banks or the European Commission.</p>', { sub: 'How to read this tool' }) +
      '<div class="grid two">' +
      card('Pressure gauges', '<p>Each gauge maps official indicators onto a 0–100 scale. An indicator scores 0 at the first value in brackets and 100 at the second, and the gauge is the weighted average of its indicators. If an indicator is not published for a country, the remaining weights are rescaled.</p>' + table(['Gauge', 'Built from'], GAUGES) +
        '<p class="note">Below 33 reads “Low”, 33–65 “Moderate”, 66 and above “High”. The overall pressure score weights the gauges 25 / 25 / 15 / 15 / 10 / 10 in the order shown.</p>', { sub: 'Diagnosis' }) +
      card('Six-month projection', '<p>The projection takes the average monthly change in the annual inflation rate over the last three months, lets that momentum fade by 30% each month, and pulls the rate towards 2% by 3% of the gap each month.</p><p>The band around it is not assumed. The same rule is run on each of the past five years of the country’s own data and its typical miss at each horizon is measured (the median absolute error, scaled to be comparable with a standard deviation); the band is plus or minus that amount. A wide band is an honest sign that the rule has been unreliable for that country.</p>' +
        '<p class="note">Strategy matching multiplies each strategy’s relevance to the six pressures by the gauge readings, then adjusts for legal readiness and speed of effect. Strategies that require a national currency are hidden for euro-area members when ranking by match.</p>', { sub: 'Early warning and matching' }) + '</div>' +
      card('Policy simulator assumptions', table(['Assumption', 'Central value', 'Range used', 'Note'], x.M.ASSUMPTIONS) +
        '<p class="note">Effects are first-year, partial and additive: measures are assumed not to interact, and behaviour beyond the listed pass-through rates is not modelled. Basket weights, consumption shares, GDP and the fiscal position are taken live from Eurostat for the selected country. Legal notes summarise EU law at a general level and are not legal advice.</p>', { sub: 'Every coefficient behind the estimates' }) +
      card('Known limits', '<ul class="plain"><li>HICP excludes owner-occupied housing costs, so housing pressure is understated where home ownership is high.</li><li>Fiscal data are annual and arrive with a lag of several months.</li><li>Ireland, Luxembourg and Malta have GDP figures distorted by multinational activity; ratios to GDP should be read with care.</li><li>The wage measure is the labour cost index for wages and salaries, which can differ from negotiated pay.</li><li>The simulator has not been estimated country by country. Ranges are wide on purpose.</li></ul>', { sub: 'What the tool cannot tell you' });
  }
  if (sub === 'install') {
    return '<div class="grid two">' +
      card('Install on any device', '<p>The tool installs like an app on phones, tablets and computers, with no app store. It then opens full screen from your home screen or desktop.</p>' +
        table(['Device', 'How'], [['iPhone and iPad', 'In Safari, tap Share, then <b>Add to Home Screen</b>.'], ['Android', 'In Chrome, Edge or Samsung Internet, open the menu and tap <b>Install app</b>.'], ['Windows, Mac, Linux, ChromeOS', 'In Chrome or Edge, select the install icon in the address bar. In Safari on a Mac, <b>File → Add to Dock</b>.']]) +
        (x.standalone ? '<p>' + x.badge('You are using the installed app', 'good') + '</p>' : '<div class="actions"><button class="btn primary" data-act="install">Install now</button></div>'), { sub: 'One tap, no store' }) +
      card('Works offline and in aeroplane mode', '<p>After the first visit, the whole tool is stored on the device. Without a connection it opens as normal and shows the last figures it fetched, with the date of each. Calculators and the simulator keep working. When the connection returns it updates itself.</p>' +
        '<p>Because each device fetches its own data directly from Eurostat and the ECB, the tool does not depend on any one computer or server staying switched on.</p>', { sub: 'No connection needed after the first visit' }) + '</div>' +
      card('Where the tool is published', x.chart(mirrors) + '<p class="note">Every address listed here serves the same tool. If an address is unavailable, your installed copy keeps working, because it runs from this device and fetches data straight from the publishers.</p>', { sub: 'Addresses that serve this tool, checked live' });
  }
  return '<div class="grid two">' +
    card('Purpose', '<p>EU Stability Compass brings the official statistics that matter for price and currency stability in the 27 member states into one place, diagnoses where pressure is coming from, and sets out the options for responding: what each would do, what it would cost, and whether EU rules allow it.</p><p>It is built for economists, finance ministries, central banks, EU institutions, regional and local authorities, businesses, journalists and households. Choose a viewpoint at the top of the page to rank strategies for your role.</p>', { sub: 'What this tool is for' }) +
    card('Independence and responsible use', '<p>This is an independent tool. It is not affiliated with, endorsed by or speaking for the European Union, the European Central Bank or any national authority. Statistics are reproduced from their open-data services under their reuse terms.</p><p>Use the diagnosis and estimates as a structured starting point. Decisions with real consequences should rest on full analysis by the responsible institutions.</p>', { sub: 'Read before relying on it' }) + '</div>' +
    card('Version', '<div class="kv"><div><span>Version</span><b>' + x.VERSION + '</b></div><div><span>Coverage</span><b>27 member states, EU and euro area</b></div><div><span>Data</span><b>Eurostat · European Central Bank</b></div><div><span>Concept and design</span><b>Samuel Akosa Onyejekwe</b></div></div>', { sub: 'About this release' });
}
