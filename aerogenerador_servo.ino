/*
 * =========================================================================
 * PROYECTO VISUALIZACIÓN DE INFORMACIÓN - AEROGENERADOR FÍSICO LEGO TECHNIC
 * Servomotor: Tower Pro MG90S (Rotación Continua 360°) + Arduino
 * Pin de Señal: Digital Pin 9 (PWM)
 * LED Integrado: Digital Pin 13
 * =========================================================================
 * 
 * COMPORTAMIENTO:
 * 1. Antes de empezar (Standby): Motor COMPLETAMENTE DETENIDO (STOP).
 * 2. Al presionar "Comenzar": Recibe año a año el % de energía limpia (0 a 100).
 *    - El motor gira a una velocidad PROPORCIONAL al porcentaje de energía limpia.
 *    - A mayor generación limpia -> mayor velocidad de giro del aerogenerador.
 *    - Si dominan las fósiles (limpias muy bajas) -> gira extremadamente lento o para.
 * 3. Al finalizar la carrera (o pulsar volver): Recibe "STOP" y se DETIENE de inmediato.
 */

#include <Servo.h>

Servo aerogenerador;

const int PIN_SERVO = 9;   // Cable Naranja / Amarillo del MG90S al Pin 9
const int PIN_LED = 13;    // LED de monitoreo visual en placa

// Constantes de calibración de giro continuo (360°):
// En un servo 360°, 90 representa el punto neutro (detenido).
// Valores de 91 a 180 hacen girar en un sentido (91 = lentísimo, 180 = máxima velocidad).
const int PUNTO_PARADA = 90;
const int VEL_MINIMA = 95;   // Velocidad mínima de arranque suave
const int VEL_MAXIMA = 180;  // Velocidad máxima con 100% de renovables

bool carreraActiva = false;

void setup() {
  Serial.begin(9600);
  aerogenerador.attach(PIN_SERVO);
  pinMode(PIN_LED, OUTPUT);

  // Estado inicial: completamente detenido
  detenerAerogenerador();
}

void loop() {
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim(); // Limpiar espacios y retornos de carro

    if (comando.length() == 0) return;

    if (comando == "STOP") {
      // Orden explícita de detenerse (antes de empezar o al finalizar)
      carreraActiva = false;
      detenerAerogenerador();
    } 
    else {
      // Si llega un número (porcentaje de 0 a 100)
      int porcentajeLimpia = comando.toInt();
      
      // Si el valor está en el rango válido
      if (porcentajeLimpia >= 0 && porcentajeLimpia <= 100) {
        carreraActiva = true;
        ajustarVelocidad(porcentajeLimpia);
      }
    }
  }
}

// Función para detener en seco el servomotor
void detenerAerogenerador() {
  aerogenerador.write(PUNTO_PARADA);
  digitalWrite(PIN_LED, LOW);
}

// Función para calibrar la velocidad según el % de energía limpia
void ajustarVelocidad(int pctLimpia) {
  // LED encendido cuando las renovables superan o igualan el 50%
  if (pctLimpia >= 50) {
    digitalWrite(PIN_LED, HIGH);
  } else {
    digitalWrite(PIN_LED, LOW);
  }

  // Si la energía limpia es casi nula (menor a 5%), mantenemos el molino quieto
  if (pctLimpia < 5) {
    aerogenerador.write(PUNTO_PARADA);
  } else {
    // Mapeo lineal: 5% a 100% de limpia se convierte en velocidad proporcional (95 a 180)
    int señalVelocidad = map(pctLimpia, 5, 100, VEL_MINIMA, VEL_MAXIMA);
    aerogenerador.write(señalVelocidad);
  }
}
