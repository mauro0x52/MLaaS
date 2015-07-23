cd ../Modeler
echo "Starting Modeler.js"
node Modeler.js &

cd components
echo "Starting Builder.js"
node Builder.js &
echo "Starting Learner.js"
node Learner.js &
echo "Starting Predictor.js"
node Predictor.js &
echo "Starting ReportsStorage.js"
node ReportsStorage.js &
echo "Starting PredictionsStorage.js"
node PredictionsStorage.js &

cd ..
cd ..
cd front-end
echo "Starting front-end.js"
node front-end.js
