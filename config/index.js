// config
require('dotenv').config();

const { PORT, OLLAMA_API_PORT } = process.env;

const config = {
  PORT: PORT || 3000,
  OLLAMA_API_PORT: OLLAMA_API_PORT || 11434,
  ENV: process.env.NODE_ENV || 'development',
};
module.exports = config;
