document.addEventListener('DOMContentLoaded', () => {
            // --- DOM Elements ---
            const playPauseButton = document.getElementById('play-pause-button'), playIcon = document.getElementById('play-icon'), pauseIcon = document.getElementById('pause-icon');
            const masterVolumeSlider = document.getElementById('master-volume-slider');
            const lockVolumeCheckbox = document.getElementById('lock-volume');
            const presetSelect = document.getElementById('preset-select'), savePresetButton = document.getElementById('save-preset-button'), deletePresetButton = document.getElementById('delete-preset-button');
            const eqPresetSelect = document.getElementById('eq-preset-select');
            const bypassEqButton = document.getElementById('bypass-eq-button');
            const saveModal = document.getElementById('save-modal'), presetNameInput = document.getElementById('preset-name-input'), cancelSaveButton = document.getElementById('cancel-save-button'), confirmSaveButton = document.getElementById('confirm-save-button');
            const settingsButton = document.getElementById('settings-button'), settingsModal = document.getElementById('settings-modal'), closeSettingsButton = document.getElementById('close-settings-button'), saveDefaultButton = document.getElementById('save-default-button'), clearDefaultButton = document.getElementById('clear-default-button');
            const channelsContainer = document.getElementById('sound-channels-container');
            const timerDisplay = document.getElementById('sleep-timer-display'), sleepHoursInput = document.getElementById('sleep-hours-input'), sleepMinutesInput = document.getElementById('sleep-minutes-input'), sleepFadeInput = document.getElementById('sleep-fade-input'), startSleepTimerButton = document.getElementById('start-sleep-timer-button'), cancelSleepTimerButton = document.getElementById('cancel-sleep-timer-button');
            const alarmTimeInput = document.getElementById('alarm-time-input'), alarmPresetSelect = document.getElementById('alarm-preset-select'), alarmFadeInput = document.getElementById('alarm-fade-input'), setAlarmButton = document.getElementById('set-alarm-button'), disableAlarmButton = document.getElementById('disable-alarm-button'), alarmStatusDisplay = document.getElementById('alarm-status-display');
            const shareButton = document.getElementById('share-button'), notification = document.getElementById('notification');
            const eqSliders = Array.from({ length: 10 }, (_, i) => document.getElementById(`eq${i + 1}-slider`));

            const tabs = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('border-gray-300', 'text-white'));
                    tab.classList.add('border-gray-300', 'text-white');
                    tabContents.forEach(c => c.classList.add('hidden'));
                    document.getElementById(`tab-content-${tab.id.split('-')[1]}`).classList.remove('hidden');
                });
            });
            document.getElementById('tab-presets').classList.add('border-gray-300', 'text-white');

            let isPlaying = false, audioInitialized = false;
            let sleepTimerId, sleepIntervalId, alarmIntervalId;
            let eqBypassed = false;

            // --- Preset Data ---
            const PRESET_STORAGE_KEY = 'fantasyCavePresets';
            const DEFAULT_SETTINGS_KEY = 'fantasyCaveDefaultSettings';
            const flatEq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const defaultSoundPresets = [
                { name: 'Classic Cave', settings: { masterVolume: 0.8, eq: flatEq, channels: { rumble: {volume: 0.6, pan: 0, mute: false}, flow: {volume: 0.7, pan: 0, mute: false}, wind: {volume: 0.1, pan: 0, mute: false}, bubbles: {volume: 0.3, pan: 0, mute: false}, drips: {volume: 0.8, pan: 0, mute: false, density: 3}, chimes: {volume: 0, pan: 0, mute: false}, lava: {volume: 0, pan: 0, mute: false}, monsters: {volume: 0, pan: 0, mute: false}, sparkle: {volume: 0.1, pan: 0, mute: false} } } },
                { name: 'Vast Cavern', settings: { masterVolume: 0.8, eq: [5, 2, -2, -5, -6, -5, -2, 1, 3, 4], channels: { rumble: {volume: 0.8, pan: -0.2, mute: false}, flow: {volume: 0.2, pan: 0.3, mute: false}, wind: {volume: 0.5, pan: 0, mute: false}, bubbles: {volume: 0.1, pan: 0.8, mute: false}, drips: {volume: 0.4, pan: -0.5, mute: false, density: 1.5}, chimes: {volume: 0, pan: 0, mute: false}, lava: {volume: 0, pan: 0, mute: false}, monsters: {volume: 0, pan: 0, mute: false}, sparkle: {volume: 0.3, pan: 0, mute: false} } } },
                { name: 'Volcanic Lair', settings: { masterVolume: 0.8, eq: [8, 7, 5, 2, 0, -2, -3, -4, -4, -5], channels: { rumble: {volume: 0.9, pan: 0, mute: false}, flow: {volume: 0.1, pan: 0, mute: false}, wind: {volume: 0.6, pan: 0.4, mute: false}, bubbles: {volume: 0.6, pan: -0.3, mute: false}, drips: {volume: 0.1, pan: 0, mute: false, density: 0.5}, chimes: {volume: 0, pan: 0, mute: false}, lava: {volume: 0.8, pan: 0, mute: false}, monsters: {volume: 0.4, pan: 0.6, mute: false}, sparkle: {volume: 0, pan: 0, mute: false} } } },
                { name: 'Crystal Grotto', settings: { masterVolume: 0.8, eq: [-5, -4, -3, -2, 0, 2, 4, 6, 8, 9], channels: { rumble: {volume: 0.2, pan: 0, mute: false}, flow: {volume: 0.4, pan: -0.1, mute: false}, wind: {volume: 0, pan: 0, mute: false}, bubbles: {volume: 0.2, pan: 0.2, mute: false}, drips: {volume: 0.9, pan: -0.4, mute: false, density: 5}, chimes: {volume: 0.7, pan: 0.5, mute: false}, lava: {volume: 0, pan: 0, mute: false}, monsters: {volume: 0, pan: 0, mute: false}, sparkle: {volume: 0.8, pan: 0, mute: false} } } }
            ];
            const eqPresets = [
                { name: 'Flat', values: flatEq },
                { name: 'Full Bass & Treble', values: [7, 5, 2, -3, -4, -4, -3, 2, 5, 7] },
                { name: 'Bass Booster', values: [8, 7, 5, 2, 0, -2, -3, -4, -4, -5] },
                { name: 'Presence', values: [-4, -3, -2, 0, 3, 5, 5, 3, 1, 0] },
                { name: 'Treble Enhancer', values: [-5, -4, -3, -2, 0, 2, 4, 6, 8, 9] },
                { name: 'Loudness Contour', values: [5, 2, -2, -5, -6, -5, -2, 1, 3, 4] }
            ];
            let userPresets = JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY)) || [];

            // --- Audio Synthesis Setup ---
            const masterVolume = new Tone.Volume(-6).toDestination();
            const masterBus = new Tone.Gain();
            const eqBands = Array.from({ length: 10 }, (_, i) => new Tone.Filter(31 * Math.pow(2, i), "peaking"));
            masterBus.chain(...eqBands, masterVolume);
            
            const channels = {};
            const channelGroups = {
                'Water & Environment': ['rumble', 'flow', 'drips'],
                'Atmospherics & Magic': ['wind', 'sparkle', 'chimes'],
                'Creatures & Dangers': ['monsters', 'lava', 'bubbles']
            };
            const channelConfig = {
                rumble: {label: 'Low Rumble'},
                flow: {label: 'Water Flow'},
                drips: {label: 'Water Drips', hasDensity: true},
                wind: {label: 'Cave Wind'},
                sparkle: {label: 'Crystal Sparkle'},
                chimes: {label: 'Crystal Chimes'},
                monsters: {label: 'Distant Monsters'},
                lava: {label: 'Lava Flow'},
                bubbles: {label: 'Bubbles / Gurgle'}
            };

            const continuousSources = {};
            Object.keys(channelConfig).forEach(id => {
                const panner = new Tone.Panner(0).connect(masterBus);
                const gain = new Tone.Gain(0).connect(panner);
                channels[id] = { gain, panner, id };
                if (id !== 'drips' && id !== 'chimes') {
                    const source = new Tone.Noise("brown").connect(gain);
                    continuousSources[id] = source;
                }
            });

            const windFilter = new Tone.AutoFilter(0.5, 100, 4).connect(channels.wind.gain);
            continuousSources.wind.disconnect().connect(windFilter);
            const bubbleFilter = new Tone.Filter(400, 'bandpass', -12).set({ Q: 5});
            new Tone.LFO(8, 400, 1000).start().connect(bubbleFilter.frequency);
            continuousSources.bubbles.type = 'white';
            continuousSources.bubbles.disconnect().connect(bubbleFilter).connect(channels.bubbles.gain);
            const lavaModGain = new Tone.Gain(0).connect(channels.lava.gain);
            new Tone.LFO(0.3, 0.2, 1.0).start().connect(lavaModGain.gain);
            continuousSources.lava.type = 'pink';
            continuousSources.lava.disconnect().connect(lavaModGain);
            const monsterModGain = new Tone.Gain(0);
            const monsterFilter = new Tone.Filter(400, 'lowpass');
            const monsterPitchShift = new Tone.PitchShift(-12).connect(channels.monsters.gain);
            monsterModGain.chain(monsterFilter, monsterPitchShift);
            new Tone.LFO(0.2, 0.3, 1.0).start().connect(monsterModGain.gain);
            continuousSources.monsters.disconnect().connect(monsterModGain);
            const sparkleFilter = new Tone.Filter(4000, "highpass").connect(channels.sparkle.gain);
            continuousSources.sparkle.type = 'white';
            continuousSources.sparkle.disconnect().connect(sparkleFilter);
            
            const dripReverb = new Tone.Reverb(6, 0.05, 0.7).connect(channels.drips.panner);
            const dripSynth = new Tone.PluckSynth({ attackNoise: 1, dampening: 8000, resonance: 0.9 }).connect(dripReverb);
            channels.drips.gain.disconnect();
            const chimesReverb = new Tone.Reverb(8, 0.1, 0.5).connect(channels.chimes.panner);
            const chimeSynth = new Tone.MetalSynth({ frequency: 200, harmonicity: 8, modulationIndex: 20, resonance: 4000, octaves: 1.5 }).connect(chimesReverb);
            channels.chimes.gain.disconnect();
            
            // --- Scheduling Logic ---
            const dripLoop = new Tone.Loop((time) => {
                if (isPlaying && !channels.drips.gain.mute) {
                    const density = parseFloat(channels.drips.densitySlider.value);
                    const T = 0.1; // Loop interval in seconds
                    const P = Math.min(density * T, 1);
                    if (Math.random() < P) {
                        dripSynth.triggerAttackRelease(['C4', 'E4', 'G4', 'A4', 'C5'][Math.floor(Math.random() * 5)], "8n", time, parseFloat(channels.drips.volumeSlider.value));
                    }
                }
            }, 0.1).start(0);

            function scheduleNextChime() {
                if (isPlaying) {
                    const delay = Math.random() * 15 + 10; // Delay in seconds (10 to 25 seconds)
                    Tone.Transport.scheduleOnce((time) => {
                        if (!channels.chimes.gain.mute) {
                            chimeSynth.triggerAttackRelease(Math.random() * 1000 + 200, "4n", time, parseFloat(channels.chimes.volumeSlider.value));
                        }
                        scheduleNextChime();
                    }, Tone.now() + delay);
                }
            }

            // --- Core Functions ---
            async function startAudio() {
                if (!audioInitialized) {
                    await Tone.start();
                    audioInitialized = true;
                }
                const fadeInTime = parseFloat(document.getElementById('fade-in-time').value) || 0;
                masterVolume.volume.value = -Infinity;
                Tone.Transport.start();
                Object.values(continuousSources).forEach(s => s.start());
                masterVolume.volume.rampTo(Tone.gainToDb(masterVolumeSlider.value), fadeInTime);
                isPlaying = true;
                updatePlayButtonUI();
                scheduleNextChime();
            }

            function stopAudio() {
                Tone.Transport.stop();
                Object.values(continuousSources).forEach(s => s.stop());
                isPlaying = false;
                updatePlayButtonUI();
            }

            function updatePlayButtonUI() {
                playIcon.classList.toggle('hidden', isPlaying);
                pauseIcon.classList.toggle('hidden', !isPlaying);
            }

            // --- Preset Functions & UI ---
            function populatePresets(selectElement, presetList, userList = []) {
                selectElement.innerHTML = '';
                if (selectElement.id === 'preset-select') selectElement.innerHTML = '<option value="">--- Custom Soundscape ---</option>';
                const createGroup = (label, presets, type) => {
                    const group = document.createElement('optgroup');
                    group.label = label;
                    presets.forEach((pr, i) => {
                        const option = document.createElement('option');
                        option.value = `${type}-${i}`;
                        option.textContent = pr.name;
                        group.appendChild(option);
                    });
                    selectElement.appendChild(group);
                };
                createGroup('Default', presetList, 'default');
                if (userList.length > 0) createGroup('Yours', userList, 'user');
                if (selectElement.id === 'preset-select') updateDeleteButtonState();
            }

            function populateEqPresets() {
                eqPresetSelect.innerHTML = '<option value="">--- Custom EQ ---</option>';
                eqPresets.forEach((p, i) => {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = p.name;
                    eqPresetSelect.appendChild(option);
                });
            }

            function applySettings(settings) {
                if (!lockVolumeCheckbox.checked) {
                    masterVolume.volume.rampTo(Tone.gainToDb(settings.masterVolume), 0.1);
                    masterVolumeSlider.value = settings.masterVolume;
                }
                Object.keys(settings.channels).forEach(key => {
                    const s = settings.channels[key];
                    const c = channels[key];
                    c.volumeSlider.value = s.volume;
                    c.gain.gain.rampTo(s.volume, 0.1);
                    c.panSlider.value = s.pan;
                    c.panner.pan.rampTo(s.pan, 0.1);
                    c.gain.mute = s.mute;
                    c.muteButton.classList.toggle('opacity-50', s.mute);
                    if (c.densitySlider && s.density !== undefined) c.densitySlider.value = s.density;
                });
                if (settings.eq) {
                    applyEqSettings(settings.eq);
                    findAndSelectEqPreset(settings.eq);
                }
            }

            function applyEqSettings(eqValues) {
                eqSliders.forEach((s, i) => {
                    s.value = eqValues[i];
                    if (!eqBypassed) {
                        eqBands[i].gain.rampTo(eqValues[i], 0.1);
                    }
                });
            }

            function getCurrentSettings() {
                const settings = {
                    masterVolume: parseFloat(masterVolumeSlider.value),
                    channels: {},
                    eq: eqSliders.map(sl => parseFloat(sl.value))
                };
                Object.keys(channels).forEach(key => {
                    const c = channels[key];
                    settings.channels[key] = {
                        volume: parseFloat(c.volumeSlider.value),
                        pan: parseFloat(c.panSlider.value),
                        mute: c.gain.mute
                    };
                    if (c.densitySlider) settings.channels[key].density = parseFloat(c.densitySlider.value);
                });
                return settings;
            }

            function updateDeleteButtonState() {
                const sel = presetSelect.value;
                deletePresetButton.disabled = !sel || sel.startsWith('default');
            }

            function findAndSelectEqPreset(eqValues) {
                const eqString = JSON.stringify(eqValues);
                const presetIndex = eqPresets.findIndex(p => JSON.stringify(p.values) === eqString);
                eqPresetSelect.value = presetIndex !== -1 ? presetIndex : "";
            }

            function showNotification(message) {
                notification.textContent = message;
                notification.classList.remove('opacity-0', '-translate-y-10');
                setTimeout(() => notification.classList.add('opacity-0', '-translate-y-10'), 2000);
            }

            // --- Event Listeners ---
            playPauseButton.addEventListener('click', () => isPlaying ? stopAudio() : startAudio());
            masterVolumeSlider.addEventListener('input', e => {
                if (!lockVolumeCheckbox.checked) {
                    masterVolume.volume.rampTo(Tone.gainToDb(parseFloat(e.target.value)), 0.1);
                }
            });
            lockVolumeCheckbox.checked = localStorage.getItem('volumeLocked') === 'true';
            lockVolumeCheckbox.addEventListener('change', () => {
                localStorage.setItem('volumeLocked', lockVolumeCheckbox.checked);
                showNotification(`Volume lock ${lockVolumeCheckbox.checked ? 'enabled' : 'disabled'}.`);
            });
            presetSelect.addEventListener('change', () => {
                const [type, index] = presetSelect.value.split('-');
                if (!type) return;
                const preset = type === 'default' ? defaultSoundPresets[parseInt(index)] : userPresets[parseInt(index)];
                if (preset) applySettings(preset.settings);
                updateDeleteButtonState();
            });
            eqPresetSelect.addEventListener('change', () => {
                if (eqPresetSelect.value === "") return;
                const preset = eqPresets[eqPresetSelect.value];
                if (preset) {
                    applyEqSettings(preset.values);
                    presetSelect.value = "";
                }
            });
            eqSliders.forEach((s, i) => s.addEventListener('input', e => {
                if (!eqBypassed) {
                    eqBands[i].gain.rampTo(parseFloat(e.target.value), 0.1);
                }
                findAndSelectEqPreset(eqSliders.map(sl => parseFloat(sl.value)));
                presetSelect.value = "";
            }));
            bypassEqButton.addEventListener('click', () => {
                eqBypassed = !eqBypassed;
                bypassEqButton.textContent = eqBypassed ? 'Enable EQ' : 'Bypass EQ';
                if (eqBypassed) {
                    eqBands.forEach(band => band.gain.rampTo(0, 0.1));
                } else {
                    eqSliders.forEach((slider, i) => eqBands[i].gain.rampTo(parseFloat(slider.value), 0.1));
                }
            });
            savePresetButton.addEventListener('click', () => {
                saveModal.classList.remove('hidden');
                presetNameInput.focus();
            });
            cancelSaveButton.addEventListener('click', () => saveModal.classList.add('hidden'));
            confirmSaveButton.addEventListener('click', () => {
                const name = presetNameInput.value.trim();
                if (!name) {
                    showNotification("Please enter a preset name.");
                    return;
                }
                userPresets.push({ name, settings: getCurrentSettings() });
                localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(userPresets));
                populatePresets(presetSelect, defaultSoundPresets, userPresets);
                populatePresets(alarmPresetSelect, defaultSoundPresets, userPresets);
                presetSelect.value = `user-${userPresets.length - 1}`;
                saveModal.classList.add('hidden');
                presetNameInput.value = '';
            });
            deletePresetButton.addEventListener('click', () => {
                const [type, index] = presetSelect.value.split('-');
                if (type === 'user') {
                    userPresets.splice(parseInt(index), 1);
                    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(userPresets));
                    populatePresets(presetSelect, defaultSoundPresets, userPresets);
                    populatePresets(alarmPresetSelect, defaultSoundPresets, userPresets);
                    presetSelect.value = "";
                    updateDeleteButtonState();
                }
            });
            settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
            closeSettingsButton.addEventListener('click', () => settingsModal.classList.add('hidden'));
            saveDefaultButton.addEventListener('click', () => {
                localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(getCurrentSettings()));
                settingsModal.classList.add('hidden');
                showNotification('Default saved!');
            });
            clearDefaultButton.addEventListener('click', () => {
                localStorage.removeItem(DEFAULT_SETTINGS_KEY);
                settingsModal.classList.add('hidden');
                showNotification('Default cleared.');
            });
            // New: Settings Panel Event Listeners
            document.getElementById('buffer-size').addEventListener('change', (e) => {
                Tone.context.bufferSize = parseInt(e.target.value);
                localStorage.setItem('bufferSize', e.target.value);
                showNotification('Audio buffer size updated.');
            });
            document.getElementById('theme-toggle').addEventListener('change', () => {
                const theme = document.getElementById('theme-toggle').checked ? 'light' : 'dark';
                localStorage.setItem('theme', theme);
                document.body.classList.toggle('light-theme', theme === 'light');
                showNotification(`Switched to ${theme} mode.`);
            });
            document.getElementById('auto-play').addEventListener('change', () => {
                localStorage.setItem('autoPlay', document.getElementById('auto-play').checked);
                showNotification('Auto-play setting updated.');
            });
            document.getElementById('fade-in-time').addEventListener('change', () => {
                localStorage.setItem('fadeInTime', document.getElementById('fade-in-time').value);
                showNotification('Fade-in time updated.');
            });
            document.getElementById('reset-all-button').addEventListener('click', () => {
                applySettings(defaultSoundPresets[0].settings);
                settingsModal.classList.add('hidden');
                showNotification('Settings reset to default.');
            });
            document.getElementById('export-presets-button').addEventListener('click', () => {
                const data = JSON.stringify(userPresets);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fantasy-cave-presets.json';
                a.click();
                URL.revokeObjectURL(url);
                settingsModal.classList.add('hidden');
                showNotification('All presets exported.');
            });

            // Timer Logic
            startSleepTimerButton.addEventListener('click', () => {
                const hours = parseInt(sleepHoursInput.value) || 0;
                const minutes = parseInt(sleepMinutesInput.value) || 0;
                const fade = parseInt(sleepFadeInput.value) || 10;
                const totalSeconds = (hours * 3600) + (minutes * 60);
                if (totalSeconds <= 0) {
                    showNotification("Please enter a valid time.");
                    return;
                }
                clearTimeout(sleepTimerId);
                clearInterval(sleepIntervalId);
                let remaining = totalSeconds;
                timerDisplay.textContent = `Fading out in ${hours}h ${minutes}m...`;
                sleepTimerId = setTimeout(() => {
                    masterVolume.volume.rampTo(-Infinity, fade);
                    setTimeout(() => {
                        stopAudio();
                        masterVolume.volume.rampTo(Tone.gainToDb(masterVolumeSlider.value), 0.1);
                    }, (fade + 1) * 1000);
                }, (totalSeconds - fade) * 1000);
                sleepIntervalId = setInterval(() => {
                    remaining--;
                    const h = Math.floor(remaining / 3600);
                    const m = Math.floor((remaining % 3600) / 60);
                    const s = remaining % 60;
                    timerDisplay.textContent = `Fading out in ${h}h ${m}m ${s}s...`;
                    if (remaining <= 0) clearInterval(sleepIntervalId);
                }, 1000);
            });
            cancelSleepTimerButton.addEventListener('click', () => {
                clearTimeout(sleepTimerId);
                clearInterval(sleepIntervalId);
                timerDisplay.textContent = 'Timer is off.';
            });

            // Alarm Logic
            setAlarmButton.addEventListener('click', () => {
                const time = alarmTimeInput.value;
                if (!time) {
                    showNotification("Please select a time.");
                    return;
                }
                clearInterval(alarmIntervalId);
                alarmStatusDisplay.textContent = `Alarm set for ${time}.`;
                alarmIntervalId = setInterval(() => {
                    const now = new Date();
                    const currentTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                    if (currentTime === time) {
                        triggerAlarm();
                        clearInterval(alarmIntervalId);
                        alarmStatusDisplay.textContent = 'Alarm is disabled.';
                    }
                }, 1000);
            });
            disableAlarmButton.addEventListener('click', () => {
                clearInterval(alarmIntervalId);
                alarmStatusDisplay.textContent = 'Alarm is disabled.';
            });
            function triggerAlarm() {
                const [type, index] = alarmPresetSelect.value.split('-');
                const preset = (type === 'default' ? defaultSoundPresets[parseInt(index)] : userPresets[parseInt(index)]) || defaultSoundPresets[0];
                const fade = parseInt(alarmFadeInput.value) || 15;
                stopAudio();
                applySettings(preset.settings);
                masterVolume.volume.value = -Infinity;
                startAudio();
                masterVolume.volume.rampTo(Tone.gainToDb(preset.settings.masterVolume), fade);
            }

            shareButton.addEventListener('click', () => {
                const settings = getCurrentSettings();
                const encoded = btoa(JSON.stringify(settings));
                const url = `${window.location.origin}${window.location.pathname}?settings=${encoded}`;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(() => showNotification('Share link copied!'));
                } else {
                    showNotification('Clipboard not available. Copy manually: ' + url);
                    console.log(url);
                }
            });

            // --- Initial Setup ---
            function createChannelControls(groupName, channelIds) {
                const accordionButton = document.createElement('button');
                accordionButton.className = 'w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-md font-bold text-lg';
                accordionButton.textContent = groupName;
                accordionButton.setAttribute('aria-expanded', 'false');
                
                const accordionContent = document.createElement('div');
                accordionContent.className = 'accordion-content p-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6';
                accordionContent.style.maxHeight = '0';

                accordionButton.onclick = () => {
                    const isOpen = accordionContent.style.maxHeight !== '0px';
                    document.querySelectorAll('.accordion-content').forEach(c => {
                        c.style.maxHeight = '0px';
                        c.previousElementSibling.setAttribute('aria-expanded', 'false');
                    });
                    if (!isOpen) {
                        accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                        accordionButton.setAttribute('aria-expanded', 'true');
                    } else {
                        accordionContent.style.maxHeight = '0px';
                        accordionButton.setAttribute('aria-expanded', 'false');
                    }
                };
                
                channelIds.forEach(id => {
                    const cfg = channelConfig[id];
                    const channel = channels[id];
                    const wrapper = document.createElement('div');
                    wrapper.className = 'space-y-2';
                    
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'flex items-center gap-2';
                    
                    const muteButton = document.createElement('button');
                    muteButton.className = 'text-gray-400 hover:text-white';
                    muteButton.setAttribute('aria-label', `Mute/Unmute ${cfg.label}`);
                    muteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
                    muteButton.onclick = () => {
                        channel.gain.mute = !channel.gain.mute;
                        muteButton.classList.toggle('opacity-50', channel.gain.mute);
                    };
                    channel.muteButton = muteButton;
                    
                    const label = document.createElement('label');
                    label.className = 'font-medium text-sm';
                    label.textContent = cfg.label;
                    
                    labelDiv.append(muteButton, label);
                    
                    const volumeSlider = document.createElement('input');
                    volumeSlider.type = 'range';
                    volumeSlider.min = 0;
                    volumeSlider.max = 1;
                    volumeSlider.step = 0.01;
                    volumeSlider.setAttribute('aria-label', `${cfg.label} Volume`);
                    volumeSlider.title = 'Volume';
                    volumeSlider.oninput = () => {
                        channel.gain.gain.rampTo(parseFloat(volumeSlider.value), 0.1);
                        presetSelect.value = "";
                    };
                    channel.volumeSlider = volumeSlider;
                    
                    const panSliderWrapper = document.createElement('div');
                    panSliderWrapper.className = 'flex items-center gap-2';
                    
                    const panLabelL = document.createElement('span');
                    panLabelL.className = 'text-xs font-mono text-gray-500';
                    panLabelL.textContent = 'L';
                    
                    const panLabelR = document.createElement('span');
                    panLabelR.className = 'text-xs font-mono text-gray-500';
                    panLabelR.textContent = 'R';
                    
                    const panSlider = document.createElement('input');
                    panSlider.type = 'range';
                    panSlider.min = -1;
                    panSlider.max = 1;
                    panSlider.step = 0.01;
                    panSlider.value = 0;
                    panSlider.setAttribute('aria-label', `${cfg.label} Pan`);
                    panSlider.title = 'Pan Left/Right';
                    panSlider.oninput = () => {
                        channel.panner.pan.rampTo(parseFloat(panSlider.value), 0.1);
                        presetSelect.value = "";
                    };
                    channel.panSlider = panSlider;
                    
                    panSliderWrapper.append(panLabelL, panSlider, panLabelR);
                    wrapper.append(labelDiv, volumeSlider, panSliderWrapper);
                    
                    if (cfg.hasDensity) {
                        const densityLabel = document.createElement('label');
                        densityLabel.textContent = "Density";
                        densityLabel.className = "font-medium text-xs text-gray-400 pt-2";
                        
                        const densitySlider = document.createElement('input');
                        densitySlider.type = 'range';
                        densitySlider.min = 0.1;
                        densitySlider.max = 10;
                        densitySlider.step = 0.1;
                        densitySlider.setAttribute('aria-label', `${cfg.label} Density`);
                        densitySlider.title = 'Frequency of drips';
                        densitySlider.oninput = () => {
                            presetSelect.value = "";
                        };
                        channel.densitySlider = densitySlider;
                        
                        wrapper.append(densityLabel, densitySlider);
                    }
                    
                    accordionContent.appendChild(wrapper);
                });

                channelsContainer.append(accordionButton, accordionContent);
            }

            function initializeValues() {
                Object.entries(channelGroups).forEach(([groupName, channelIds]) => {
                    createChannelControls(groupName, channelIds);
                });

                const urlParams = new URLSearchParams(window.location.search);
                const settingsFromUrl = urlParams.get('settings');
                if (settingsFromUrl) {
                    try {
                        applySettings(JSON.parse(atob(settingsFromUrl)));
                    } catch (e) {
                        console.error("Could not parse settings from URL", e);
                    }
                } else {
                    const savedDefault = JSON.parse(localStorage.getItem(DEFAULT_SETTINGS_KEY));
                    applySettings(savedDefault || defaultSoundPresets[0].settings);
                }
                
                populatePresets(presetSelect, defaultSoundPresets, userPresets);
                populatePresets(alarmPresetSelect, defaultSoundPresets, userPresets);
                populateEqPresets();
                findAndSelectEqPreset(eqSliders.map(s => parseFloat(s.value)));

                // New: Initialize settings from localStorage
                document.getElementById('buffer-size').value = localStorage.getItem('bufferSize') || '256';
                Tone.context.bufferSize = parseInt(document.getElementById('buffer-size').value);
                document.getElementById('theme-toggle').checked = localStorage.getItem('theme') === 'light';
                document.body.classList.toggle('light-theme', localStorage.getItem('theme') === 'light');
                document.getElementById('auto-play').checked = localStorage.getItem('autoPlay') === 'true';
                document.getElementById('fade-in-time').value = localStorage.getItem('fadeInTime') || '2';
                if (localStorage.getItem('autoPlay') === 'true') startAudio();
            }

            initializeValues();
        });