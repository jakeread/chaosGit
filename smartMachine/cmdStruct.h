struct CMDpair { // code & values to execute with
  char code;
  String valString;
  float val;
  bool wasExecuted = false;
};

struct CMD {
  String ogString = "";
  CMDpair pairs[5];
  bool isReady = false;
  bool wasExecuted = false;
};

// wash
