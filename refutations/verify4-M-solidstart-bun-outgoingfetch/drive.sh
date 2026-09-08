#!/bin/zsh
# usage: drive.sh <sinkport> <appport> <label>
SINK=$1; APP=$2; LABEL=$3
curl -s -X DELETE http://127.0.0.1:$SINK/__items > /dev/null
echo "--- $LABEL fetchout ---"; curl -s http://127.0.0.1:$APP/api/fetchout; echo
echo "--- $LABEL httpout ---"; curl -s http://127.0.0.1:$APP/api/httpout; echo
curl -s http://127.0.0.1:$APP/api/sentinel > /dev/null
for i in {1..30}; do
  if curl -s http://127.0.0.1:$SINK/__items | grep -q sentinel; then break; fi
  perl -e 'select(undef,undef,undef,0.5)'
done
echo "--- $LABEL items ---"
curl -s http://127.0.0.1:$SINK/__items | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{JSON.parse(d).forEach(i=>console.log(JSON.stringify(i)))})'
echo "--- $LABEL recorded headers ---"
curl -s http://127.0.0.1:$SINK/__recorded
echo
