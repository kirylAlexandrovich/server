# Use a lighter version of Node as a parent image

# Set the working directory to /api

# copy package.json into the container at /api

# install dependencies

# Copy the current directory contents into the container at /api

# Make port 8080 available to the world outside this container

# Run the app when the container launches

FROM mhart/alpine-node:8.11.4
WORKDIR /api
COPY package*.json /api/
RUN npm install
COPY . /api/
EXPOSE 8080
CMD [“npm”, “start”]