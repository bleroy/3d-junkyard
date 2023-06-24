; Sidecar XE85 interrupt handler
; Written by Bertrand Le Roy
; Modified from Atari's CX-85 interrupt handler

TIMERA	= $30
TIMERB	= $06
START	= $09			; Start mask
SELECT	= $0A			; Select mask
OPTION	= $0C			; Option mask
BPOT	= $08			; BPOT bit mask
VVBLKD	= $224			; Vertical blank interrupt
STRIG0	= $284			; Controller port 1 OS shadow
STRIG1	= $285			; Controller port 2 OS shadow
ATTRACT	= $4D			; Attract mode flag
CH	    = $2FC			; Keyboard code
ALLPOT	= $D208			; All pot status 
PORTA	= $D300			; Port A
SETVBV	= $E45C			; Routine for setting vectors
DOSINI	= $0C			; Warm start address
CONSOL	= $D01F			; Console switch port
BREAK	= $11			; Break key flag

; Pad key code values

PAD_0	    = $1C
PAD_1	    = $19
PAD_2	    = $1A
PAD_3	    = $1B
PAD_4	    = $11
PAD_5	    = $12
PAD_6	    = $13
PAD_7	    = $15
PAD_8	    = $16
PAD_9	    = $17
PAD_PERIOD	= $1D
PAD_MINUS	= $1F
PAD_ENTER	= $1E
PAD_ESC	    = $0C
PAD_NO	    = $14
PAD_DEL	    = $10
PAD_YES	    = $18

; Additional codes for Sidecar XE85 not on Atari SX85

PAD_SLASH	    = $00
PAD_PLUS	    = $00
PAD_ASTERISK	= $00

; POKEY KBCODE Values

KEY_NONE    = $FF

KEY_0       = $32
KEY_1       = $1F
KEY_2       = $1E
KEY_3       = $1A
KEY_4       = $18
KEY_5       = $1D
KEY_6       = $1B
KEY_7       = $33
KEY_8       = $35
KEY_9       = $30

KEY_A       = $3F
KEY_B       = $15
KEY_C       = $12
KEY_D       = $3A
KEY_E       = $2A
KEY_F       = $38
KEY_G       = $3D
KEY_H       = $39
KEY_I       = $0D
KEY_J       = $01
KEY_K       = $05
KEY_L       = $00
KEY_M       = $25
KEY_N       = $23
KEY_O       = $08
KEY_P       = $0A
KEY_Q       = $2F
KEY_R       = $28
KEY_S       = $3E
KEY_T       = $2D
KEY_U       = $0B
KEY_V       = $10
KEY_W       = $2E
KEY_X       = $16
KEY_Y       = $2B
KEY_Z       = $17

KEY_COMMA       = $20
KEY_PERIOD      = $22
KEY_SLASH       = $26
KEY_SEMICOLON   = $02
KEY_PLUS        = $06
KEY_ASTERISK    = $07
KEY_DASH        = $0E
KEY_EQUALS      = $0F
KEY_LESSTHAN    = $36
KEY_GREATERTHAN = $37

KEY_ESC     = $1C
KEY_TAB     = $2C
KEY_SPACE   = $21
KEY_RETURN  = $0C
KEY_DELETE  = $34
KEY_CAPS    = $3C
KEY_INVERSE = $27
KEY_HELP    = $11

KEY_F1      = $03
KEY_F2      = $04
KEY_F3      = $13
KEY_F4      = $14

KEY_SHIFT   = $40
KEY_CTRL    = $80

; Composed keys

KEY_EXCLAMATIONMARK = KEY_1 | KEY_SHIFT
KEY_QUOTE           = KEY_2 | KEY_SHIFT
KEY_HASH            = KEY_3 | KEY_SHIFT
KEY_DOLLAR          = KEY_4 | KEY_SHIFT
KEY_PERCENT         = KEY_5 | KEY_SHIFT
KEY_AMPERSAND       = KEY_6 | KEY_SHIFT
KEY_APOSTROPHE      = KEY_7 | KEY_SHIFT
KEY_AT              = KEY_8 | KEY_SHIFT
KEY_OPENINGPARAN    = KEY_9 | KEY_SHIFT
KEY_CLOSINGPARAN    = KEY_0 | KEY_SHIFT
KEY_UNDERLINE       = KEY_DASH | KEY_SHIFT
KEY_BAR             = KEY_EQUALS | KEY_SHIFT
KEY_COLON           = KEY_SEMICOLON | KEY_SHIFT
KEY_BACKSLASH       = KEY_PLUS | KEY_SHIFT
KEY_CIRCUMFLEX      = KEY_ASTERISK | KEY_SHIFT
KEY_OPENINGBRACKET  = KEY_COMMA | KEY_SHIFT
KEY_CLOSINGBRACKET  = KEY_PERIOD | KEY_SHIFT
KEY_QUESTIONMARK    = KEY_SLASH | KEY_SHIFT
KEY_CLEAR           = KEY_LESSTHAN | KEY_SHIFT
KEY_INSERT          = KEY_GREATERTHAN | KEY_SHIFT

KEY_UP              = KEY_UNDERLINE | KEY_CTRL
KEY_DOWN            = KEY_EQUALS | KEY_CTRL
KEY_LEFT            = KEY_PLUS | KEY_CTRL
KEY_RIGHT           = KEY_ASTERISK | KEY_CTRL

    * = $0600   ;Start at page 6

COLD:
	LDA	DOSINI		; Copy DOS init to WRMEXT
    STA	WRMEXT + 1
    LDA	DOSINI + 1
    STA	WRMEXT + 2

	LDA	#<WARMST	; Replace DOSINI with WARMST
    STA	DOSINI
    LDA	#>WARMST
    STA	DOSINI + 1

KPADVBI:			; Chain keypad into deferred VBLANK processing
	LDA	VVBLKD		; Save VVBLKD for keypad exit point
    STA	EXIT + 1
    LDA	VVBLKD + 1
    STA	EXIT + 2
        
    LDY	#<KPAD		; Replace VVBLKD with keypad entry point
    LDX	#>KPAD
    LDA	#7		    ; Deferred VBI
    JSR	SETVBV
    RTS
        
WARMST:	JSR	KPADVBI	; Entered when user hits system reset
WRMEXT:	JMP	0		; Chain to DOSINI

KPADTAB:	; Pad key code, Pokey key code

	.byte	PAD_ESC,	KEY_ESC
    .byte	PAD_NO,		KEY_CLOSINGPARAN
    .byte	PAD_DEL,	KEY_DELETE
    .byte	PAD_YES,	KEY_OPENINGPARAN
    .byte	PAD_0,		KEY_0
    .byte	PAD_1,		KEY_1
    .byte	PAD_2,		KEY_2
    .byte	PAD_3,		KEY_3
    .byte	PAD_4,		KEY_4
    .byte	PAD_5,		KEY_5
    .byte	PAD_6,		KEY_6
    .byte	PAD_7,		KEY_7
    .byte	PAD_8,		KEY_8
    .byte	PAD_9,		KEY_9
    .byte	PAD_PERIOD,	KEY_PERIOD
    .byte	PAD_MINUS,	KEY_DASH
    .byte	PAD_ENTER,	KEY_RETURN
    .byte	PAD_SLASH,	KEY_SLASH
    .byte	PAD_PLUS,	KEY_PLUS
    .byte	PAD_ASTERISK,	KEY_ASTERISK
        
    .byte 0			; End of table
     
KPAD:				; Entered at each vblank to read the keypad
	LDA	STRIG1		; Key pressed?
    BNE	KPADDM		; Exit if no key pressed
    LDA	#0		    ; Reset attract mode
    STA	ATTRACT
        
    LDA	PORTA		; Read cable pin of port 2
    LSR	
    LSR	
    LSR	
    LSR	
    STA	TEMP
    LDA	ALLPOT		; Read ALLPOT for 5th cable pin stat
    AND	#BPOT		; Mask for 5th pin
    EOR	#BPOT		; Complement bit (0 is valid)
    ASL	
    ORA	TEMP		; A has key value
    LDY	#0		; Init counter
        
KPADCK:				; Scan translation table
	CMP	KPADTAB,Y	; Match keypad table entry?
    BEQ	KPADMAT		; Jump if match
    INY			; Inc to next entry
    INY
    LDX	KPADTAB,Y	; End of table?
    BNE	KPADCK
        
KPADMAT:			; Key value matches
	TAX	    		; Save key value
    INY		    	; Get Pokey keycode
    LDA	KPADTAB,Y	; A has keycode
    CMP	KPADCOD		; Same as prior keycode?
    BEQ	KPADSAM		; Branch if same
    STA	KPADCOD		; Else store new code
    STA	CH
    LDA	#TIMERA		; Reset timer
    STA	KPADREP
    BNE	EXIT1
        
KPADDM:
	LDA	#$C0		; Load dummy variable
    STA	KPADCOD
        
EXIT1:
	LDA	#1		    ; Reset BRK press flag
    STA	BRKPRS
    BNE	EXIT
        
KPADSAM:			; Same as prior key, check auto-repeat
	LDX	KPADREP		; Auto-repeat expired?
    DEX		    	; Decrement timer
    BNE	KPADXX		; Branch if not
    STA	CH  		; Store keycode
	LDA	#TIMERB		; Reset timer
    STA	KPADREP
    BNE	EXIT1
        
KPADXX:
	STX	KPADREP
        
EXIT:				; Exit this VBLANK interrupt
	JMP	0		    ; Chain to deferred VBLANK
        
TEMP:
    .byte	0		; Temp variable
KPADCOD:
	.byte	0		; Prior keycode
KPADREP:
	.byte	$30		; Auto-repeat timer

BRKPRS:
    .byte	1		; Break press flag

    END	COLDST