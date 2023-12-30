 		
; Atari 8-bit "Draw circle" sample code
; Written by Bertrand Le Roy
; Assemble with DASM
; This draws a 200px diameter circle on the screen in 320x200 resolution

        processor 6502

	include "atari.inc"

;Local constants
R		    = 99	;Circle radius
CY                  = 100	;Y coordinate of the screen center
LINE_ADDRESSES_MSB  = $1200	;Table of most significant bytes of addresses of the center of each scan line
LINE_ADDRESSES_LSB  = $1300	;Table of least significant bytes of addresses of the center of each scan line
PLOT_VECTOR	    = $D0	;Vector used to plot pixels
CURRENT_COL_OFFSET  = $13FF	;Used to store the current byte offset for the column to plot
CURRENT_BIT_MASK    = $13FE	;Used to store the mask to turn on the current pixel
CURRENT_REV_MASK    = $13FD	;Used to store the mask to turn on the current symmetric pixel
X                   = $13FC	;Stores the x coordinate of the current circle pixel
Y                   = $13FB	;Stores the y coordinate of the current circle pixel
F                   = $13FA	;Stores the current value of the discriminating function

        org     $a000           ;Start of left cartridge area
Start	
        ;Setup colors, display width and display list location
        lda	#$28
        sta     COLOR0+0
        lda     #$00
        sta     COLOR0+1
        lda     #$06
        sta     COLOR0+2             
        lda	#$58
        sta     COLOR0+3
        lda     #$D4
        sta     COLOR0+4	; bakground
        lda     #$00            ;Set Display list pointer
        sta     SDLSTL		;Shadow DLISTL
        lda     #$A2
        sta     SDLSTH		;Shadow DLISTH
        lda     #$22
        sta     SDMCTL		;Shadow DMACTL (playfield width)
        
generatelineaddresses
	;Pre-compute addresses for the middle of each line
	lda	#$20			;Start from $2024
        sta	LINE_ADDRESSES_MSB	;Store the most significant bytes to $1200...
        lda	#$24
        sta	LINE_ADDRESSES_LSB	;And least significant bytes to $1300...
        ldx	#0
nextline
	clc
	lda	LINE_ADDRESSES_LSB,x
        adc	#40	;Add 40 for each scan line
        sta	LINE_ADDRESSES_LSB + 1,x
        lda	LINE_ADDRESSES_MSB,x
        adc	#0
        sta	LINE_ADDRESSES_MSB + 1,x
        inx
        cpx	#200	;Stop at line 200
        bne	nextline
        
plot_circle
        ;Plot the center
        ldx	#0
        ldy	#CY
        jsr	plot
	
        ;Plot the circle
        ;Initialize x,y and initial value of f
        lda	#0
        sta	X
        lda	#R
        sta	Y
        sec
        lda	#0
        sbc	#R
        sta	F
        jsr	plot_symmetries
circle_loop
	;f+=1+x<<1;x++
	ldx	X
        txa
        inx
        stx	X
        asl
        clc
        adc	#1
        clc
        adc	F
        sta	F
        jsr 	plot_symmetries
        lda	F
        bmi	skip_lateral
        beq	skip_lateral
        ;f+=1-y<<1;y--
        ldy	Y
        tya
        dey
        sty	Y
        asl
        eor	#$FF
        clc
        adc	#2
        clc
        adc	F
        sta	F
        jsr	plot_symmetries
skip_lateral
	sec
	lda	X
        cmp	Y
        bmi	circle_loop
        
        ;We're done. Do nothing for a while.
wait
	nop
        jmp     wait

plot	;Plots the pixel at x+160,y and 160-x,y
	txa	;x has the x coordinate
        lsr	;5 most significant bits are the offset
        lsr	;of the byte where the pixel is
        lsr
        sta	CURRENT_COL_OFFSET
        txa
        and	#$07			;3 least significant bits point to the bit for the pixel
        tax
        lda	pixelmasks,x
        sta	CURRENT_BIT_MASK	;CURRENT_BIT_MASK now has the bit mask for the new pixel
        lda	reverse_pixelmasks,x
        sta	CURRENT_REV_MASK
        clc
        lda	LINE_ADDRESSES_LSB,y	;y has the y coordinate, load the least significant byte of the address of the middle of screen for the line
        adc	CURRENT_COL_OFFSET	;Add to the offset for x
        sta	PLOT_VECTOR
        lda	LINE_ADDRESSES_MSB,y	;Load the most significant byte of the address of the middle of the screen for the line
        adc	#0			;Carry
        sta	PLOT_VECTOR + 1		;PLOT_VECTOR now has the address of the byte to write to
        ldx	#0
        lda	(PLOT_VECTOR),x		;Read the previous state of the byte
        ora	CURRENT_BIT_MASK	;Turn the right pixel on
        sta	(PLOT_VECTOR),x
        sec
        lda	LINE_ADDRESSES_LSB,y	;y has the y coordinate, load the least significant byte of the address of the middle of screen for the line
        sbc	CURRENT_COL_OFFSET	;Add to the offset for x
        sta	PLOT_VECTOR
        lda	LINE_ADDRESSES_MSB,y	;Load the most significant byte of the address of the middle of the screen for the line
        sbc	#0			;Carry
        sta	PLOT_VECTOR + 1		;PLOT_VECTOR now has the address of the byte to write to
        ldx	#0
        lda	(PLOT_VECTOR),x		;Read the previous state of the byte
        ora	CURRENT_REV_MASK	;Turn the right pixel on
        sta	(PLOT_VECTOR),x
	rts

plot_symmetries	;plots a point and its transformations by all 8 simple symmetries of the circle
	;x,y
	ldx	X
        clc
        lda	Y
        adc	#CY
        tay
        jsr	plot
        ;x,-y
        ldx	X
        sec
        lda	#CY
        sbc	Y
        tay
        jsr	plot
        ;y,x
        clc
	lda	X
        adc	#CY
        tay
        ldx	Y
        jsr	plot
        ;y,-x
        sec
        lda	#CY
        sbc	X
        tay
        ldx	Y
        jsr	plot
        rts

	org	$A200
        ;Display list data (generated using https://bocianu.gitlab.io/fidl/)
display_list
  .BYTE $70, $70, $10, $4f, $10, $20, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $4f, $00, $30
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f, $0f
  .BYTE $41, $00, $A2
dlistend

pixelmasks
	.byte 128,64,32,16,8,4,2,1
reverse_pixelmasks
	.byte 1,2,4,8,16,32,64,128

	;Cartridge footer
        org     CARTCS
        .word 	Start	; cold start address
        .byte	$00	; 0 == cart exists
        .byte	$04	; boot cartridge
        .word	Start	; start
