/*
 * PROYECTO VISUALIZACION DE INFORMACION - AEROGENERADOR FISICO LEGO TECHNIC
 * Servomotor: Tower Pro MG90S (Rotacion Continua 360 grados) + Arduino
 * Pin Senal: Pin Digital 9 (PWM)
 */

#include <Servo.h>

Servo aerogenerador;

const int PIN_SERVO = 9;   // Cable Naranja o Amarillo al Pin 9
const int PIN_LED = 13;    // LED de prueba en placa

// Calibracion de giro continuo:
// En un servo 360, 90 representa el punto neutro (detenido).
// Valores de 95 a 180 hacen girar el motor (mas alto = mas rapido).
const int PUNTO_PARADA = 90;
const int VEL_MINIMA = 95;   // Giro suave inicial
const int VEL_MAXIMA = 180;  // Maxima velocidad (100% renovable)

bool carreraActiva = false;

void setup() {
  Serial.begin(9600);
  aerogenerador.attach(PIN_SERVO);
  pinMode(PIN_LED, OUTPUT);

  // Iniciar completamente detenido
  detenerAerogenerador();
}

void loop() {
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim();

    if (comando.length() == 0) return;

    if (comando == "STOP") {
      // Orden de detenerse (antes de empezar o al terminar la carrera)
      carreraActiva = false;
      detenerAerogenerador();
    } 
    else {
      // Valor de porcentaje limpio recibido (0 a 100)
      int porcentajeLimpia = comando.toInt();
      
      if (porcentajeLimpia >= 0 && porcentajeLimpia <= 100) {
        carreraActiva = true;
        ajustarVelocidad(porcentajeLimpia);
      }
    }
  }
}

void detenerAerogenerador() {
  aerogenerador.write(PUNTO_PARADA);
  digitalWrite(PIN_LED, LOW);
}

void ajustarVelocidad(int pctLimpia) {
  // LED testigo cuando gana la energia limpia (>= 50%)
  if (pctLimpia >= 50) {
    digitalWrite(PIN_LED, HIGH);
  } else {
    digitalWrite(PIN_LED, LOW);
  }

  // Si la generacion limpia es casi nula, no se mueve
  if (pctLimpia < 5) {
    aerogenerador.write(PUNTO_PARADA);
  } else {
    // Mapeo proporcional a la velocidad
    int senalVelocidad = map(pctLimpia, 5, 100, VEL_MINIMA, VEL_MAXIMA);
    aerogenerador.write(senalVelocidad);
  }
}
