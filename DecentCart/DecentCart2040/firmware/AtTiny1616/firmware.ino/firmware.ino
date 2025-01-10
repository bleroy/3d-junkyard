/* I2C SC-Card Module - see http://www.technoblogy.com/show?1LJI

   David Johnson-Davies - www.technoblogy.com - 7th July 2022
   ATtiny1614 @ 20MHz (internal clock; BOD disabled)
   
   CC BY 4.0
   Licensed under a Creative Commons Attribution 4.0 International license: 
   http://creativecommons.org/licenses/by/4.0/

   Modded by B. Le Roy 2024
*/

#include <SD.h>
 
File myFile;

// LEDs **********************************************

const int LEDoff = 0;
const int LEDgreen = 1;
const int LEDred = 2;

void LightLED (int colour) {
  digitalWrite(PIN_PA6, colour & 1);
  digitalWrite(PIN_PA7, colour>>1 & 1);
}

// I2C Interface **********************************************

const int Namelength = 13;
char Filename[Namelength];
static union { unsigned long Filesize; uint8_t Filebytes[4]; };

const int MyAddress = 0x55;

// TWI setup **********************************************

void I2CSetup () {
  TWI0.CTRLA = 0;                                        // Default timings
  TWI0.SADDR = MyAddress<<1;                             // Bottom bit is R/W bit
  // Enable address, data, and stop interrupts:
  TWI0.SCTRLA = TWI_APIEN_bm | TWI_DIEN_bm | TWI_PIEN_bm | TWI_ENABLE_bm;
}

// Functions to handle each of the cases **********************************************

int command = 0;                                         // Currently active command
int ch = 0, ptr = 0;                                     // Filename and size pointers
bool checknack = false;                               // Don't check Host NACK first time

bool AddressHostRead () {
  return true;
}

bool AddressHostWrite () {
  command = 0; ch = 0; ptr = 0;                          // Reset these on writing
  return true;
}

void DataHostRead () {
  if (command == 'R') {
    TWI0.SDATA = myFile.read();                          // Host read operation
  } else if (command == 'S') { 
    if (ptr < 4) {
      if (ptr == 0) Filesize = myFile.size();
      TWI0.SDATA = Filebytes[3-ptr];                     // MSB first
      ptr++;
    } else TWI0.SDATA = 0;                               // Host read too many bytes
  } else TWI0.SDATA = 0;                                 // Read in other situations
}

bool DataHostWrite () {
  if (command == 0) {                                    // No command in progress
    command = TWI0.SDATA;
    if (!myFile && (command != 'F')) {
      if (command == 'W') {
        myFile = SD.open(Filename, O_RDWR | O_CREAT | O_TRUNC);
      } else if (command == 'R' || command == 'S') {
        myFile = SD.open(Filename, O_READ); 
      } else if (command == 'A') {
        myFile = SD.open(Filename, O_RDWR | O_CREAT | O_APPEND);
      }
      if (myFile) {
        LightLED(LEDgreen);                              // File opened successfully
        return true;
      } else {
        LightLED(LEDred);                                // Problem
        return false;
      }
    } else {
      return true;
    }
  } else if (command == 'F') {                           // Read filename
    if (ch < Namelength) {
      Filename[ch++] = TWI0.SDATA;
      Filename[ch] = 0;
      return true;
    } else {                                             // Filename too long
      return false;
    }
  } else if (command == 'W' || command == 'A') {
    myFile.write(TWI0.SDATA);                            // Write byte to file
    return true;
  } else if (command == 'R' || command == 'S') {
    return false;
  }
  return false;
}

void Stop () {
  if (command == 'W' || command == 'R' || command == 'A' || command == 'S') {
    myFile.close(); LightLED(LEDoff);                    // Close file
  }
}

void SendResponse (bool succeed) {
  if (succeed) {
    TWI0.SCTRLB = TWI_ACKACT_ACK_gc | TWI_SCMD_RESPONSE_gc;     // Send ACK
  } else {
    TWI0.SCTRLB = TWI_ACKACT_NACK_gc | TWI_SCMD_RESPONSE_gc;    // Send NACK
  }
}

// TWI interrupt service routine **********************************************

// TWI interrupt
ISR(TWI0_TWIS_vect) { 
  bool succeed;

  // Address interrupt:
  if ((TWI0.SSTATUS & TWI_APIF_bm) && (TWI0.SSTATUS & TWI_AP_bm)) {
    if (TWI0.SSTATUS & TWI_DIR_bm) {                     // Host reading from client
      succeed = AddressHostRead();
    } else {
      succeed = AddressHostWrite();                      // Host writing to client
    }
    SendResponse(succeed);
    return;
  }
  
  // Data interrupt:
  if (TWI0.SSTATUS & TWI_DIF_bm) {
    if (TWI0.SSTATUS & TWI_DIR_bm) {                     // Host reading from client
      if ((TWI0.SSTATUS & TWI_RXACK_bm) && checknack) {
        checknack = false;
      } else {
        DataHostRead();
        checknack = true;
      } 
      TWI0.SCTRLB = TWI_SCMD_RESPONSE_gc;                // No ACK/NACK needed
    } else {                                             // Host writing to client
      succeed = DataHostWrite();
      SendResponse(succeed);
    }
    return;
  }

  // Stop interrupt:
  if ((TWI0.SSTATUS & TWI_APIF_bm) && (!(TWI0.SSTATUS & TWI_AP_bm))) {
    Stop();
    TWI0.SCTRLB = TWI_SCMD_COMPTRANS_gc;                 // Complete transaction
    return;
  }
}

// Setup **********************************************

void setup (void) {
  pinMode(PIN_PA6, OUTPUT);
  pinMode(PIN_PA7, OUTPUT);
  SD.begin();
  I2CSetup();
}
 
void loop (void) {
}
