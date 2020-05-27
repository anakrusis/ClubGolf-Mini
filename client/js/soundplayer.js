FREQ_TBL = [16.352, 17.324, 18.354, 19.445, 20.601, 21.826, 23.124, 24.500, 25.956, 27.500, 29.135, 30.867];
CHANNELS_AMT = 7;

song = {
speed:2,
ch:[
" 14r3-g45r3+f9r3f129r3d#9r6g12r3-c39r6+a#54r6g54r6d#174r6+c174r3---g33r6++cr3--e9r3d#"," 14r3+c15r3-g9r3g9r3fra9r3a#9r6c12r6d36r3e39r3crc9r3c9r6+f12r6--c36r6+g12r6a#36r6a#54r6f54r6f42r6a0r6b0r6a54r6+g12r6-g#12r6g#18r24g12r6f18r6c30r3-d#21r6g12r3++d#15r6-d#rc#r3++d9r3----d#"," 14r3e15r3+c9r3-b9r3ar-g9r3g9r6+f12r6d#36r3+c15r3-g9r3g9r3frf9r3f9r6a#12r6c36r6+d#12r6-f18r3--a#r6++a#0r6+c0r6d12r6-g24r6g0r6+c0r6-a#12r6f24r6a#0r6+c0r6c12r6-f18r6g0r6+c0r3-gr6+f12r6c24r6fr---g#12r6+++c12r6cr-a#ra#30r6g#18r6g12r6d#12r6-g#18r6+d12r6-g#12r6+grf#r15c3r+a#r---d9r3+d"," 14r3g9r3-gr+er-gr+dr-gr+crc9r3d#9r6-g12r6+g36r3-g15r3++c9r3-b9r3ara9r3a#9r6-g12r6+g36r6-f12r6++d18r6-a0r6-f0r6e0r6e12r6++c18r3-gr6-e0r6-a#0r6+f12r6+a18r6a0r6-d#0r6-f0r6+d12r6+b18r6b0r6--g0r6+++d0r6--c12r6++e18r6e0r6---a#0r6+++g0r3-d#15r6+f12r6d#rdrd12r6-a#12r6a#18r6a#12r6g#12r6-b18r3++d#15r6--a#12r6+a#rbr15f3r27-d"," 74r3c9r3-a9r3gr6a#0r3g9r3g9r3grdr+g9r3-gr+er-gr+dr-grdrg9r3g9r3+d9r3-gr6+a#0r3-g9r3grcr6g0r6f#0r3+c9r3-fr6a#0r3f9r3fr6-a#0r3++grar6-a#r3er6+c0r3-e9r3er+erergrc9r3-fr6+c0r3-f9r3d#r6+f0r3grara9r3-dr6+d0r3-d9r3-gr6++d0r3er6---g0r3++++c9r3--cr6+g0r3-c9r3-a#r6+++c0r3dr6e0r24-c12r6--a#ra#r+d#12r6++d#12r6--d#18r6d#12r6++c12r6-d#r3-d#r-a#r6++d#12r6d#12r6+a#rd#r15-a#3r27-f#"," 578r6g#r3--g#r6++c0r3--g#9r3++d#9r3fra#r+a#9r3--d#r6+g0r3-d#9r3+c#9r3-d#r-a#r++d#9r3-d#r6+c0r3-d#9r6d#r3++g#rg0r3f0r6d#r3---gr6+++d#0r3---f#9r3+++a#9r6+d#r15-d3r27-c"," 794r3--f9r3++++d#9r15----d#3r27++f3r-dr-dr+d9r3d9r3dr-dr+d9r3dr-d",]}

soundInitted = false;
//muted = [true, false, true, true, true, true, true, true, true, true]
muted = [];

var soundPlayerInit = function () {

	notes = [4];
	octaves = [4];
	volumes = [4];
	lengths = [4];
	noteTicks = [4];

	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	masterGainNode = audioCtx.createGain();
	masterGainNode.gain.value = 0.3;
	masterGainNode.connect(audioCtx.destination);
	
	oscs = [4];
	
	currentChar = [4]; // used for mml parsing
	
	// init oscillator notes
	for (i = 0; i < CHANNELS_AMT; i++){
		oscs[i] = audioCtx.createOscillator();
		oscs[i].connect(masterGainNode);
		oscs[i].type = 'triangle';

		noteTicks[i] = 0;
		currentChar[i] = 0;
		octaves[i] = 4;
		lengths[i] = 0;
		
		oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime); //init oscs with 0 freq
		
		oscs[i].start();
		muted[i] = false;
	}
	
	soundInitted = true;
}

var soundPlayerTick = function () {
	
	if (soundInitted){
		for (i = 0; i < song.ch.length; i++){
			
			if (noteTicks[i] == 0){
				
				hasNote = false;
				hasRhythm = false;
				chData = song.ch[i];
				for (j = 1; j < chData.length; j++){
				
					offsetIndex = (currentChar[i] + j) % (chData.length);
					offsetChar = chData.substring(offsetIndex, offsetIndex+1);
			
					if (offsetIndex == 0){ // reset octaves if we pass by the loop point
						octaves[i] = 4;
					}			
			
					switch (offsetChar){
					
						case "-":
							octaves[i]--;
							octaves[i] = Math.max(0, octaves[i]);
							break;
						case "+":
							octaves[i]++;
							octaves[i] = Math.min(8, octaves[i]);
							break;
						case "c":
							notes[i] = 0;hasNote = true;
							break;
						case "d":
							notes[i] = 2;hasNote = true;
							break;
						case "e":
							notes[i] = 4;hasNote = true;
							break;
						case "f":
							notes[i] = 5;hasNote = true;
							break;
						case "g":
							notes[i] = 7;hasNote = true;
							break;
						case "a":
							notes[i] = 9;hasNote = true;
							break;
						case "b":
							notes[i] = 11;hasNote = true;
							break;
						case "r":
							notes[i] = -1;hasNote = true;
							break;
							
						default:
							fullSub = chData.substring(offsetIndex);
							if (parseInt(fullSub, 10) != NaN && !hasRhythm){
								//console.log(offsetChar + " " + i);
								lengths[i] = parseInt(fullSub, 10) * song.speed;
								hasRhythm = true;
							}
							break;
					}
					
					if (hasNote){
						
						hasRhythm = false;
						
						currentChar[i] = offsetIndex;
						nextChar = chData.substring(offsetIndex+1, offsetIndex+2);
						if (nextChar == "#"){
							notes[i] = (notes[i] + 1) % 12;
							currentChar[i]++;
						}
						if (notes[i] == -1 || muted[i]){ // note cut
							oscs[i].frequency.setValueAtTime(0, audioCtx.currentTime);
							
						}else{
							octaveMult = Math.pow(2, octaves[i])
							freq = FREQ_TBL[notes[i]] * octaveMult ;
							
							oscs[i].frequency.setValueAtTime(freq, audioCtx.currentTime);
						}
						
						noteTicks[i] = lengths[i] - 1;
					
						break;
					}
				}
			
			} else {
			
				noteTicks[i]--;
				
			}
		}
	}
}