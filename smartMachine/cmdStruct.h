struct CMDpair { // code & values to execute with
  char code;
  String valString;
  float val;
  bool isReady = false;
  bool wasExecuted = false;
};

struct CMD {
  String ogString = "";
  CMDpair pairs[5];
  bool isReady = false;
  bool hasToMove = false;
  bool isMeasurement = false;
  bool wasExecuted = false;
  String replyString = "";
};

// wash
