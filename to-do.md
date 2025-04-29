**To do (15/4)**

**Set Up**

- Cuando clickeo en cross para eliminar ship, dejar esa ship seleccionada..?
  Cuando se hace click en "confirmar" y no está lista la board -> warning message...

**Replace placeholders con bot actions**
Cambiar:
-empty board por board generada randomly por el bot -> poder recibir board del bot
-"simular turno del enemigo" por turnos del bot -> poder recibir ataques del bot y mostrarlos

**Playable match**
-Distinguir entre hit y nave hundida (not sure si ya se implementó)
-Detectar cuando se ganó
-Otorgar puntaje al usuario (logged) cuando gana la partida contra el bot...

**Extras**
Avisar cuando se sale de la página que se pierde la partida??
O permitir que el bot quede hanging por cierto tiempo (persistencia temporal)
Qué pasa si se hace log out mid-match??
dice "resultado: el enemigo fallo". decir "resultado: agua"?

**INSTRUCCIONES SEBA PARCIAL 1:**
Usuarios no logged in tienen id temporal asociado a la SESION (cookies?) y a ese id se asocia la board del setup
-> modificar sistema de persistencia de la board del setup... (juan)

Pasar toda la lógica del juego al back (sofi)

ID de partida para direccionar a ella...
Guardar PARTIDA en db ("persistencia") -> gameId, 2 playerIds, boards, historial, hits/misses/#sunk, isOver (sofi)
Guardar más estadísticas en db (hits+misses -> calcular accuracy)

Mostrar "chat" con historial de la partida (juan)

Botón de abandono en partida == derrota (juan)
1 solo idioma (ranking, rules, logout/log in/register) (juan)
Mismo form para register y editar perfil (juan)

Cómo acceder a partidas previas? -> historial de partidas en perfil..? (sofi)
