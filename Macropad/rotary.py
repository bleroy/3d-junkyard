from machine import Pin

encoder_A = Pin(20, Pin.IN)
encoder_B = Pin(21, Pin.IN)

counter = 0
previous_A = encoder_A.value()

def on_encoder_pin_down(p):
    global counter, previous_A
    
    A = encoder_A.value()
    B = encoder_B.value()
    # print('A:{a} B:{b}'.format(a = A, b = B))
    
    if A and B:
        # Both are low, change counter depending on which went first
        if previous_A:
            # A went first
            counter += 1
        else:
            # B went first
            counter -= 1
    else:
        previous_A = A
    
    print(counter)

# Call update every time one of the pins falls or rises
encoder_A.irq(on_encoder_pin_down, Pin.IRQ_FALLING | Pin.IRQ_RISING)
encoder_B.irq(on_encoder_pin_down, Pin.IRQ_FALLING | Pin.IRQ_RISING) 

print('Ready')
