from mido import *
from mido import MidiFile
import sys
import math

path_in = sys.argv[1]
path_out = sys.argv[2]

midi_in = MidiFile(path_in)
file_out = open(path_out, "w")

NOTES = ["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"]

channels =  [ ] # the concatenated strings of mml to be outputted
octaves =   [ ]
onsetTime =  [ ] # the tick of note onset
releaseTime =[ ] # tick of note release
                # note duration is noteTime-lastTime
durations = [ ]
pitches =   [ ] # midi note values, for matching note_on and note_offs
available = [ ]

DIVISOR = 10

def main():

    track = midi_in.tracks[1]
    trackTime = 0
    newChannel()

    currentChannel = -1;
    
    for msg in track:
        if (msg.type == "note_on"):
            trackTime += msg.time

            note = (msg.note % 12)
            octave = math.floor(msg.note / 12) - 1
            
            if (msg.velocity == 0): # Note release: write the note length first, then octave changes, finally the note name.
 
                currentChannel = findChannel(msg.note)
                print("Note " + NOTES[note] + " on Channel " + str(currentChannel))
                
                releaseTime[currentChannel] = trackTime
                duration = releaseTime[currentChannel] - onsetTime[currentChannel]
                duration = int(duration/DIVISOR)
                
                channels[currentChannel] += str(duration)

                if (octave > octaves[currentChannel]):
                    diff = octave-octaves[currentChannel]
                    channels[currentChannel] += ("+" * diff)
                    octaves[currentChannel] = octave

                elif (octave < octaves[currentChannel]):
                    diff = octaves[currentChannel]-octave
                    channels[currentChannel] += ("-" * diff)
                    octaves[currentChannel] = octave
                
                channels[currentChannel] += NOTES[note]

                pitches[currentChannel] = -1
                available[currentChannel] = True
                
            else:
                currentChannel = nearestChannel(octave)
                if (currentChannel == -1):
                    newChannel()
                    currentChannel = len(channels)-1
                

                onsetTime[currentChannel] = trackTime
                duration = onsetTime[currentChannel] - releaseTime[currentChannel]
                duration = int(duration/DIVISOR)

                if (releaseTime[currentChannel] == 0): # Special case for the beginning of midis: 140ticks or 14 adjusted of blank space at beginning
                    duration -= int(260/DIVISOR)
                
                channels[currentChannel] += str(duration)
                channels[currentChannel] += "r"
                
                pitches[currentChannel] = msg.note
                available[currentChannel] = False

    writeFile()

def writeFile():
    file_out.write("var song = {\nspeed:2,\nloop:true,\nch:[")
    for i in range( len(channels) ):
        file_out.write('\n"' + channels[i] + '0r",')
    file_out.write("]}")

def newChannel():
    channels.append(" ")
    octaves.append(4)
    pitches.append(0)
    onsetTime.append(0)
    releaseTime.append(0)
    durations.append(0)
    available.append(True)

def findChannel(midiNote):
    for i in range( len(pitches) ):
        if (pitches[i] == midiNote and not available[i]):
            return i
    return -1                    

# Returns the index of the channel available with the closest octave,
# to minimize the use of octave commands and save space
def nearestChannel( currentOctave ):
    diff = 1000
    channel = -1
    for i in range( len(channels) ):
        if abs( octaves[i] - currentOctave ) < diff and available[i]:
        #if (available[i]):
            diff = abs ( octaves[i] - currentOctave )
            channel = i
    return channel        
    
main()
