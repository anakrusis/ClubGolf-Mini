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
noteTime =  [ ] # the tick of note onset
lastTime =  [ ] # tick of the last note onset
                # note duration is noteTime-lastTime
durations = [ ]
pitches =   [ ] # midi note values, for matching note_on and note_offs
available = [ ]

DIVISOR = 15

def main():

    track = midi_in.tracks[1]
    trackTime = 0
    newChannel()

    currentDuration = 0;
    lastDuration = -1;
    currentChannel = -1;
    
    for msg in track:
        if (msg.type == "note_on"):

            trackTime += msg.time

            if (msg.velocity == 0): # Note release
                currentChannel = findChannel(msg.note)
                pitches[currentChannel] = 0
                available[currentChannel] = True
                
            else: # Note onset
                
                note = (msg.note % 12)
                octave = math.floor(msg.note / 12) - 1

                currentChannel = nearestChannel(octave)
                if (currentChannel == -1):
                    newChannel()
                    currentChannel = len(channels)-1
                    
                #print("Channel: " + str(currentChannel))
                pitches[currentChannel] = msg.note
                available[currentChannel] = False

            noteTime[currentChannel] = trackTime
            currentDuration = noteTime[currentChannel] - lastTime[currentChannel]

            if currentDuration != durations[currentChannel]:
                channels[currentChannel] += str( int( currentDuration / 10 ))
                #channels[currentChannel] += str( 6 )
                durations[currentChannel] = currentDuration
            
            if (msg.velocity == 0): # On note release, we write a note
                octave = math.floor(lastMsg.note / 12) - 1
                note = (lastMsg.note % 12)

                print("Note: " + NOTES[note] + " Octave: " + str(octave))
                
                if (octave > octaves[currentChannel]):
                    diff = octave-octaves[currentChannel]
                    channels[currentChannel] += ("+" * diff)
                    octaves[currentChannel] = octave

                elif (octave < octaves[currentChannel]):
                    diff = octaves[currentChannel]-octave
                    channels[currentChannel] += ("-" * diff)
                    octaves[currentChannel] = octave

                channels[currentChannel] += NOTES[note]   
                
            else: # On note onset, we write the rest/release                
                channels[currentChannel] += "r"                

            lastTime[currentChannel] = trackTime
            lastMsg = msg

    writeFile()

def writeFile():
    file_out.write("song = {\nspeed:2,\nch:[")
    for i in range( len(channels) ):
        file_out.write('\n"' + channels[i] + '",')
    file_out.write("]}")

def newChannel():
    channels.append(" ")
    octaves.append(4)
    pitches.append(0)
    noteTime.append(0)
    lastTime.append(0)
    durations.append(0)
    available.append(True)

def findChannel(midiNote):
    for i in range( len(pitches) ):
        if (pitches[i] == midiNote):
            return i

# Returns the index of the channel available with the closest octave,
# to minimize the use of octave commands and save space
def nearestChannel( currentOctave ):
    diff = 1000
    channel = -1
    for i in range( len(channels) ):
        #if abs( octaves[i] - currentOctave ) < diff and available[i]:
        if (available[i]):
            #diff = abs ( octaves[i] - currentOctave )
            channel = i
    return channel        
    
main()
