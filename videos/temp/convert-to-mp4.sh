gst-launch-1.0 filesrc location=$1 ! decodebin name=demux ! queue ! videoconvert ! x264enc ! mp4mux ! filesink location=$2
MP4Box -dash 1 -rap -frag-rap $2
rm -r $1
rm -r $2
rm -r *.mdp
mv $3 $2
