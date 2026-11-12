// Código de Arduino para la Carrera Dual de Descarbonización (2 Servomotores)
// Autor: Grupo 27 - Visualización de Información

#include <Servo.h>

// Definición de pines PWM recomendados en Arduino Uno / Nano:
// Pin 9  -> Servo 1 (País 1 - Ranura Izquierda)
// Pin 10 -> Servo 2 (País 2 - Ranura Derecha)
const int PIN_SERVO_1 = 9;
const int PIN_SERVO_2 = 10;

// Pines para LEDs indicadores opcionales
const int PIN_LED_1 = 6;
const int PIN_LED_2 = 7;

Servo servoPais1;
Servo servoPais2;

// Calibración de Servos de Rotación Continua (MG90S 360°)
// 90 = Parado
// 95 a 180 = Giro horario proporcional a la velocidad
const int PUNTO_PARADA = 90;
const int VEL_MIN = 93;   // Velocidad mínima apenas se detecta energía limpia
const int VEL_MAX = 180;  // Velocidad máxima (100% renovable)

void setup() {
  Serial.begin(9600);
  
  servoPais1.attach(PIN_SERVO_1);
  servoPais2.attach(PIN_SERVO_2);
  
  pinMode(PIN_LED_1, OUTPUT);
  pinMode(PIN_LED_2, OUTPUT);
  
  // Iniciar ambos detenidos
  pararServos();
}

void loop() {
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();
    
    if (comando == "STOP") {
      pararServos();
    } else {
      // El formato recibido es "V1,V2" (ejemplo: "65,30")
      int comaIndex = comando.indexOf(',');
      if (comaIndex > 0) {
        int pctLimpia1 = comando.substring(0, comaIndex).toInt();
        int pctLimpia2 = comando.substring(comaIndex + 1).toInt();
        
        controlarServo(servoPais1, PIN_LED_1, pctLimpia1);
        controlarServo(servoPais2, PIN_LED_2, pctLimpia2);
      }
    }
  }
}

// Función para mapear el porcentaje de renovables a velocidad de rotación
void controlarServo(Servo &servo, int pinLed, int pctLimpia) {
  if (pctLimpia < 5) {
    // Si la energía renovable es prácticamente nula, el aerogenerador no gira
    servo.write(PUNTO_PARADA);
    digitalWrite(pinLed, LOW);
  } else {
    // Si supera el 50% de matriz limpia, encendemos el LED de transición exitosa
    if (pctLimpia >= 50) {
      digitalWrite(pinLed, HIGH);
    } else {
      digitalWrite(pinLed, LOW);
    }
    
    // Mapeo proporcional a la velocidad
    int velocidad = map(pctLimpia, 5, 100, VEL_MIN, VEL_MAX);
    servo.write(velocidad);
  }
}

void pararServos() {
  servoPais1.write(PUNTO_PARADA);
  servoPais2.write(PUNTO_PARADA);
  digitalWrite(PIN_LED_1, LOW);
  digitalWrite(PIN_LED_2, LOW);
}

