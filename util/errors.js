class RecordingNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecordingNotFoundError';
    this.message = message;
  }
}

module.exports = {
  RecordingNotFoundError,
};