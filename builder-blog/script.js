// ==========================================================
// 1. DYNAMIC PRESETS FOR GEMINI PLAYGROUND
// ==========================================================
const presets = {
    aiims: {
        sysInst: `You are the SkipQ AI Medical Triage Waiting Assistant.
Your goal is to reassure visitors and explain their ticket status warmly.
Address the patient context in India (OPD crowding).
Format advice clearly in English and Hindi (हिन्दी).
Detail specific desk requirements: Patients need their OP Card and Aadhaar Card.`,
        json: {
            organization: "AIIMS New Delhi",
            branch: "OPD General Medicine",
            desk: "Counter 4 (Dr. A. Sharma)",
            currentServingToken: "H-101",
            visitorToken: "H-104",
            peopleAhead: 3,
            estimatedWaitMinutes: 24,
            priorityTag: "Senior Citizen (Needs seating assistance)",
            metadata: {
                aadhaarVerified: true,
                hospitalCardStatus: "Active"
            }
        },
        output: `<p><strong>English:</strong> You are <strong>3rd in line</strong> at Desk 4 for Dr. Sharma. Your estimated wait time is <strong>24 minutes</strong>. Since you require seating assistance, please feel free to wait inside the Priority Lounge (Area B), where comfortable seating is reserved. Make sure you have your OP Card and Aadhaar Card ready for rapid consultation.</p>
<p style="margin-top: 12px;"><strong>Hindi (हिन्दी):</strong> आप डॉ. शर्मा के काउंटर 4 पर लाइन में <strong>तीसरे स्थान</strong> पर हैं। आपकी प्रतीक्षा का अनुमानित समय <strong>24 मिनट</strong> है। आपकी सुविधा के लिए, कृपया एरिया बी के प्रायोरिटी लाउंज में बैठें, जहाँ विश्राम की सुविधा उपलब्ध है। तुरंत जाँच के लिए अपना ओपीडी कार्ड और आधार कार्ड तैयार रखें।</p>`
    },
    iit: {
        sysInst: `You are the SkipQ Academic Desk Triage Guide.
Format advice for busy college students waiting for transcripts or fee certificates.
Optimize response to keep desk time under 2 minutes.
Translate status to Marathi (मराठी) and English.
Detail required documents: Student ID, Grade Sheets, Dean's approval slip.`,
        json: {
            organization: "IIT Bombay",
            branch: "Registrar Office",
            desk: "Desk 2 (Transcripts & Certificates)",
            currentServingToken: "S-038",
            visitorToken: "S-044",
            peopleAhead: 6,
            estimatedWaitMinutes: 18,
            priorityTag: "Urgent scholarship deadline today",
            metadata: {
                feeCleared: true,
                transcriptCopiesRequested: 3
            }
        },
        output: `<p><strong>English:</strong> You are <strong>6th in line</strong> for Desk 2. Your transcript will be called in roughly <strong>18 minutes</strong>. Because you have an active scholarship deadline today, our registrar team has been alerted for priority processing. Keep your Student ID, Grade Sheets, and the Dean's approval slip ready to complete your submission in under 2 minutes.</p>
<p style="margin-top: 12px;"><strong>Marathi (मराठी):</strong> तुम्ही डेस्क २ साठी <strong>६ व्या क्रमांकावर</strong> आहात. १८ मिनिटांत तुमचा नंबर येईल. आज स्कॉलरशिपची शेवटची तारीख असल्याने रजिस्ट्रार टीमला सूचित केले आहे. जलद पडताळणीसाठी तुमचे आयडी कार्ड, गुणपत्रिका आणि डीनचे मंजुरी पत्र सोबत ठेवा.</p>`
    },
    sbi: {
        sysInst: `You are the SkipQ Banking Desk Guide.
Format advice to keep banking operations smooth and secure.
Address queue issues like printer delays or cash drawer limits.
Provide clear details in Hindi (हिन्दी) and English.
Remind customers about PAN cards and original passbooks.`,
        json: {
            organization: "State Bank of India",
            branch: "Lucknow Regional Desk",
            desk: "Counter 3 (Accounts & Passbook Updates)",
            currentServingToken: "B-140",
            visitorToken: "B-142",
            peopleAhead: 2,
            estimatedWaitMinutes: 12,
            priorityTag: "Passbook printer backlog",
            metadata: {
                accountType: "Savings",
                updateType: "Passbook Printing"
            }
        },
        output: `<p><strong>English:</strong> You are <strong>2nd in line</strong> at Counter 3. Estimated wait is <strong>12 minutes</strong>. Note: There is a minor printer queue backlog, so your update might take 3 additional minutes at the counter. Please have your original passbook and PAN Card open and ready to save transaction time.</p>
<p style="margin-top: 12px;"><strong>Hindi (हिन्दी):</strong> आप काउंटर 3 पर लाइन में <strong>दूसरे स्थान</strong> पर हैं। अनुमानित समय <strong>12 मिनट</strong> है। पासबुक प्रिंटर में थोड़ी व्यस्तता है, इसलिए काउंटर पर 3 मिनट का अतिरिक्त समय लग सकता है। कृपया अपनी मूल पासबुक और पैन कार्ड तैयार रखें ताकि आपका काम जल्दी हो सके।</p>`
    }
};

// ==========================================================
// 2. PLAYGROUND STATE MANAGEMENT
// ==========================================================
const presetSelect = document.getElementById('playground-preset-select');
const sysInstTextarea = document.getElementById('sys-inst');
const promptJsonView = document.getElementById('prompt-json-view');
const playgroundOutput = document.getElementById('playground-output');
const btnRunPlayground = document.getElementById('btn-run-playground');
const btnResetPlayground = document.getElementById('btn-reset-playground');
const tempSlider = document.getElementById('temp-slider');
const tempVal = document.getElementById('temp-val');
const inputTokensSpan = document.getElementById('input-tokens');
const outputTokensSpan = document.getElementById('output-tokens');

let activePresetKey = 'aiims';

function loadPreset(key) {
    activePresetKey = key;
    const preset = presets[key];
    if (!preset) return;

    sysInstTextarea.value = preset.sysInst;
    promptJsonView.textContent = JSON.stringify(preset.json, null, 4);
    playgroundOutput.innerHTML = 'Click "Run Model Prompt" to execute the Gemini query.';
    inputTokensSpan.textContent = Math.floor(preset.sysInst.length / 4) + 120;
    outputTokensSpan.textContent = '0';
}

// System Slider
tempSlider.addEventListener('input', (e) => {
    tempVal.textContent = parseFloat(e.target.value).toFixed(2);
});

// Select Preset Listener
presetSelect.addEventListener('change', (e) => {
    loadPreset(e.target.value);
});

// Reset Button Listener
btnResetPlayground.addEventListener('click', () => {
    loadPreset(activePresetKey);
});

// Run Prompt with Typewriter Effect
btnRunPlayground.addEventListener('click', () => {
    if (btnRunPlayground.classList.contains('loading')) return;

    btnRunPlayground.classList.add('loading');
    playgroundOutput.innerHTML = '<span class="output-placeholder">Executing LLM Prompt Triage... Pinging Google Cloud Vertex AI endpoint...</span>';
    
    // Simulate API Network Latency
    setTimeout(() => {
        btnRunPlayground.classList.remove('loading');
        
        const preset = presets[activePresetKey];
        const outputHtml = preset.output;
        
        // Simulating Typewriter stream
        playgroundOutput.innerHTML = '';
        outputTokensSpan.textContent = Math.floor(outputHtml.length / 5);
        
        let index = 0;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = outputHtml;
        const textNodes = Array.from(tempDiv.childNodes);
        
        function appendNode() {
            if (index < textNodes.length) {
                playgroundOutput.appendChild(textNodes[index].cloneNode(true));
                index++;
                setTimeout(appendNode, 250);
            }
        }
        appendNode();
        
    }, 1200);
});

// ==========================================================
// 3. LIVE QUEUE SIMULATOR LOGIC
// ==========================================================
let queue = [
    { token: "H-101", name: "Sparrow Dev", lang: "English", priority: "Urgent Case", status: "serving" },
    { token: "H-102", name: "Priya Sharma", lang: "Hindi", priority: "Standard", status: "waiting" },
    { token: "H-103", name: "Rajesh Patel", lang: "Hindi", priority: "Senior Citizen", status: "waiting" },
    { token: "H-104", name: "Harish (You)", lang: "English", priority: "Senior Citizen", status: "waiting" },
    { token: "H-105", name: "Anand Iyer", lang: "Tamil", priority: "Standard", status: "waiting" }
];

let completedCount = 102;
let tokenCounter = 105;

const queueTableBody = document.getElementById('queue-table-body');
const opServingToken = document.getElementById('operator-serving-token');
const opServingName = document.getElementById('operator-serving-name');
const opStatTotal = document.getElementById('operator-stat-total');
const opStatCompleted = document.getElementById('operator-stat-completed');

const btnCallNext = document.getElementById('btn-call-next');
const btnMarkNoShow = document.getElementById('btn-mark-noshow');
const btnCompleteService = document.getElementById('btn-complete-service');

const btnJoinQueue = document.getElementById('btn-join-queue');
const addVisitorName = document.getElementById('add-visitor-name');
const addVisitorLang = document.getElementById('add-visitor-lang');
const addVisitorPriority = document.getElementById('add-visitor-priority');

// Customer Ticket Elements
const mobTicketNumber = document.getElementById('mobile-ticket-number');
const mobPeopleAhead = document.getElementById('mobile-people-ahead');
const mobEstWait = document.getElementById('mobile-est-wait');
const mobAiAdvice = document.getElementById('mobile-ai-advice');
const mobTicketBadge = document.getElementById('mobile-ticket-badge');

function renderQueue() {
    // 1. Calculate general stats
    opStatTotal.textContent = queue.length;
    opStatCompleted.textContent = completedCount;

    // 2. Clear and rebuild table
    queueTableBody.innerHTML = '';
    
    let currentServing = null;
    queue.forEach(item => {
        if (item.status === 'serving') {
            currentServing = item;
        }

        const tr = document.createElement('tr');
        if (item.status === 'serving') {
            tr.classList.add('serving-row');
        }

        let statusClass = 'status-waiting';
        if (item.status === 'serving') statusClass = 'status-serving';
        if (item.status === 'benched') statusClass = 'status-benched';

        tr.innerHTML = `
            <td><strong>${item.token}</strong></td>
            <td>${item.name}</td>
            <td>${item.lang}</td>
            <td><span class="tech-tag">${item.priority}</span></td>
            <td><span class="status-badge ${statusClass}">${item.status}</span></td>
        `;
        queueTableBody.appendChild(tr);
    });

    // 3. Update Operator Serving Display
    if (currentServing) {
        opServingToken.textContent = currentServing.token;
        opServingName.textContent = currentServing.name;
    } else {
        opServingToken.textContent = "None";
        opServingName.textContent = "Counter Empty";
    }

    // 4. Update Customer View (H-104)
    const myTicketIndex = queue.findIndex(item => item.token === 'H-104');
    if (myTicketIndex !== -1) {
        const myTicket = queue[myTicketIndex];
        mobTicketNumber.textContent = myTicket.token;

        if (myTicket.status === 'serving') {
            mobTicketBadge.className = "ticket-status-dot active";
            mobTicketBadge.innerHTML = '<i class="fas fa-circle-check"></i> Active';
            mobPeopleAhead.textContent = "0 people";
            mobEstWait.textContent = "0 mins";
            mobAiAdvice.innerHTML = "You are currently being called! Please step forward to <strong>Counter 4</strong> for Dr. Sharma. Prepare your Aadhaar Card and Hospital OP card.";
        } else if (myTicket.status === 'benched') {
            mobTicketBadge.className = "ticket-status-dot";
            mobTicketBadge.innerHTML = '<i class="fas fa-user-clock"></i> Benched';
            mobPeopleAhead.textContent = "Paused";
            mobEstWait.textContent = "Cooldown";
            mobAiAdvice.innerHTML = "Your number was called but you were not present. You have been placed on the no-show bench. Please alert the counter operator to resume.";
        } else {
            // Count how many waiting people are in front of us
            let peopleAhead = 0;
            for (let i = 0; i < myTicketIndex; i++) {
                if (queue[i].status === 'waiting') {
                    peopleAhead++;
                }
            }
            const waitTime = peopleAhead * 6;

            mobTicketBadge.className = "ticket-status-dot";
            mobTicketBadge.innerHTML = '<i class="fas fa-circle-nodes"></i> Waiting';
            mobPeopleAhead.textContent = `${peopleAhead} people`;
            mobEstWait.textContent = `${waitTime} mins`;

            if (peopleAhead === 0) {
                mobAiAdvice.innerHTML = "You are next in line! Your wait time is approximately 2 minutes. Please wait near Counter 4.";
            } else {
                mobAiAdvice.innerHTML = `You are <strong>${peopleAhead} people ahead</strong> of your turn. Estimated wait is <strong>${waitTime} mins</strong>. Gemini recommends: Grab a hot tea nearby, we will message you via WhatsApp when you are next!`;
            }
        }
    } else {
        // We've been completed or removed
        mobTicketNumber.textContent = "Done";
        mobTicketBadge.className = "ticket-status-dot active";
        mobTicketBadge.innerHTML = '<i class="fas fa-square-check"></i> Checked Out';
        mobPeopleAhead.textContent = "Finished";
        mobEstWait.textContent = "0 mins";
        mobAiAdvice.textContent = "Your service has been successfully completed! Thank you for using SkipQ. Aadhaar records saved in system.";
    }

    // 5. Update WhatsApp Chat Mockup based on the active queue state
    const waTextContent = document.getElementById('wa-text-content');
    if (waTextContent) {
        const waitingItems = queue.filter(item => item.status === 'waiting');
        const servingItem = queue.find(item => item.status === 'serving');

        if (servingItem) {
            waTextContent.innerHTML = `नमस्कार <strong>${servingItem.name}</strong>! You are currently being called at Counter 4 for Dr. Sharma. Please step forward. Bring your Outpatient (OP) Card and Aadhaar Card.`;
        } else if (waitingItems.length > 0) {
            const nextInLine = waitingItems[0];
            const activeIdx = queue.findIndex(item => item.status === 'serving');
            const targetIdx = queue.indexOf(nextInLine);
            const peopleAhead = activeIdx !== -1 ? targetIdx - activeIdx : targetIdx;
            const waitTime = peopleAhead * 6;
            
            waTextContent.innerHTML = `नमस्कार <strong>${nextInLine.name}</strong>! You are 1st in line at Counter 4. Estimated wait: ${waitTime} mins. Bring your Outpatient (OP) Card and Aadhaar Card. Reply [1] if present, [2] to postpone 5m, or [3] to cancel.`;
        } else {
            waTextContent.innerHTML = `नमस्कार! All checkups completed at Counter 4. Thank you for using SkipQ queue triage!`;
        }
    }
}

// Call Next operator action
btnCallNext.addEventListener('click', () => {
    // 1. If someone is currently serving, mark them completed
    const servingIdx = queue.findIndex(item => item.status === 'serving');
    if (servingIdx !== -1) {
        completedCount++;
        queue.splice(servingIdx, 1);
    }

    // 2. Call the next waiting person
    const waitingIdx = queue.findIndex(item => item.status === 'waiting');
    if (waitingIdx !== -1) {
        queue[waitingIdx].status = 'serving';
    }

    renderQueue();
    showToastNotification('Queue advanced! Next visitor called.');
});

// Mark No-Show operator action (Bench)
btnMarkNoShow.addEventListener('click', () => {
    const servingIdx = queue.findIndex(item => item.status === 'serving');
    if (servingIdx !== -1) {
        const item = queue[servingIdx];
        item.status = 'benched';
        // Re-push to the end of the queue list as benched
        queue.splice(servingIdx, 1);
        queue.push(item);

        // Serve next in line
        const waitingIdx = queue.findIndex(item => item.status === 'waiting');
        if (waitingIdx !== -1) {
            queue[waitingIdx].status = 'serving';
        }

        renderQueue();
        showToastNotification(`Token ${item.token} benched due to absence.`);
    } else {
        showToastNotification('No active visitor to bench.');
    }
});

// Complete Service
btnCompleteService.addEventListener('click', () => {
    const servingIdx = queue.findIndex(item => item.status === 'serving');
    if (servingIdx !== -1) {
        const item = queue[servingIdx];
        completedCount++;
        queue.splice(servingIdx, 1);

        // Serve next in line
        const waitingIdx = queue.findIndex(item => item.status === 'waiting');
        if (waitingIdx !== -1) {
            queue[waitingIdx].status = 'serving';
        }

        renderQueue();
        showToastNotification(`Token ${item.token} consultation complete.`);
    } else {
        showToastNotification('No active consultation to complete.');
    }
});

// Join queue form action
btnJoinQueue.addEventListener('click', () => {
    const name = addVisitorName.value.trim();
    if (!name) {
        showToastNotification('Please enter a name first.');
        return;
    }

    tokenCounter++;
    const newToken = {
        token: `H-${tokenCounter}`,
        name: name,
        lang: addVisitorLang.value,
        priority: addVisitorPriority.value,
        status: queue.length === 0 ? 'serving' : 'waiting'
    };

    queue.push(newToken);
    addVisitorName.value = '';
    renderQueue();
    showToastNotification(`Token ${newToken.token} registered! Joined waiting list.`);
});

// ==========================================================
// 4. UTILITIES AND SHARING
// ==========================================================
const toast = document.querySelector('[data-toast]');
const copyButtons = document.querySelectorAll('[data-copy-link]');
const btnLinkedinShare = document.getElementById('btn-linkedin-share');
const scrollTopButton = document.querySelector('[data-scroll-top]');

function showToastNotification(message) {
    if (!toast) return;
    toast.querySelector('span').textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(showToastNotification.timeoutId);
    showToastNotification.timeoutId = window.setTimeout(() => {
        toast.classList.remove('visible');
    }, 2200);
}

async function copyCurrentLink() {
    const link = window.location.origin + window.location.pathname;
    try {
        await navigator.clipboard.writeText(link);
        showToastNotification('Launch link copied to clipboard!');
    } catch {
        showToastNotification('Copy unavailable');
    }
}

copyButtons.forEach(btn => btn.addEventListener('click', copyCurrentLink));

btnLinkedinShare?.addEventListener('click', () => {
    const text = encodeURIComponent("I'm excited to share SkipQ! Powered by Google Cloud Gemini API, we're building digital waitlists to solve hospital and bank crowding in India. Check it out! #GoogleAI #SaaS #Waitlist #IndiaProduct");
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
    showToastNotification('Opening LinkedIn Share Portal!');
});

scrollTopButton?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ==========================================================
// 5. SaaS PRODUCTIVITY ROI CALCULATOR MATH
// ==========================================================
const roiVisitors = document.getElementById('roi-visitors');
const roiWait = document.getElementById('roi-wait');
const roiWage = document.getElementById('roi-wage');

const roiVisitorsVal = document.getElementById('roi-visitors-val');
const roiWaitVal = document.getElementById('roi-wait-val');
const roiWageVal = document.getElementById('roi-wage-val');
const roiResult = document.getElementById('roi-result');
const roiHoursSaved = document.getElementById('roi-hours-saved');

function updateROICalculations() {
    if (!roiVisitors || !roiWait || !roiWage) return;
    const dailyVisitors = parseInt(roiVisitors.value);
    const waitSaved = parseInt(roiWait.value);
    const wage = parseInt(roiWage.value);

    // Assumptions: 300 active branch working days per year in India
    const yearlyVisitors = dailyVisitors * 300;
    const hoursSaved = Math.round((yearlyVisitors * waitSaved) / 60);
    const unlockedValue = hoursSaved * wage;

    roiVisitorsVal.textContent = dailyVisitors;
    roiWaitVal.textContent = waitSaved;
    roiWageVal.textContent = wage;
    roiHoursSaved.textContent = hoursSaved.toLocaleString('en-IN');
    roiResult.textContent = '₹' + unlockedValue.toLocaleString('en-IN');
}

roiVisitors?.addEventListener('input', updateROICalculations);
roiWait?.addEventListener('input', updateROICalculations);
roiWage?.addEventListener('input', updateROICalculations);

// ==========================================================
// 6. WHATSAPP MOCK INTERACTIVE REPLY BUTTONS
// ==========================================================
const waOptHere = document.getElementById('wa-opt-here');
const waOptDelay = document.getElementById('wa-opt-delay');
const waOptCancel = document.getElementById('wa-opt-cancel');

waOptHere?.addEventListener('click', () => {
    const servingItem = queue.find(item => item.status === 'serving') || queue.filter(item => item.status === 'waiting')[0];
    if (servingItem) {
        showToastNotification(`SBI Counter 3 Alert: ${servingItem.name} confirmed they are present in lobby.`);
    } else {
        showToastNotification('No active visitors in queue.');
    }
});

waOptDelay?.addEventListener('click', () => {
    const waitingItems = queue.filter(item => item.status === 'waiting');
    if (waitingItems.length > 0) {
        const itemToDelay = waitingItems[0];
        const idx = queue.indexOf(itemToDelay);
        queue.splice(idx, 1);
        queue.push(itemToDelay); // Pushed to the end of the queue
        renderQueue();
        showToastNotification(`WhatsApp Command: Postponed ${itemToDelay.name}'s token.`);
    } else {
        showToastNotification('No waiting visitors to delay.');
    }
});

waOptCancel?.addEventListener('click', () => {
    const waitingItems = queue.filter(item => item.status === 'waiting');
    if (waitingItems.length > 0) {
        const itemToCancel = waitingItems[0];
        const idx = queue.indexOf(itemToCancel);
        queue.splice(idx, 1);
        renderQueue();
        showToastNotification(`WhatsApp Command: Cancelled token for ${itemToCancel.name}.`);
    } else {
        showToastNotification('No active waiting visitor to cancel.');
    }
});

// ==========================================================
// 7. INITIALIZATION
// ==========================================================
// Active navigation tracker
const sections = document.querySelectorAll('.section, .hero');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 120)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Startup Boot
loadPreset('aiims');
renderQueue();
updateROICalculations();
