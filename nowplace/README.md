# NowPlace

MVP escolar desenvolvido com HTML, CSS e JavaScript nativo para compartilhar registros de lugares e momentos.

## Recursos utilizados
- `getUserMedia()` para acessar a câmera.
- `Canvas` para capturar fotos.
- `geolocation` para obter a localização.
- `fetch()` para consultar endereços e enviar textos à API.
- `localStorage` para armazenar publicações e dados do usuário.
- Drag and Drop para trocar fotos.
- Cálculo de distância para filtrar publicações próximas.

## APIs utilizadas
- **JSONPlaceholder.dev:** demonstra o envio de publicações de texto.
- **Nominatim:** converte coordenadas em endereços legíveis.

## Limitações
As publicações completas ficam no `localStorage` do navegador, sem compartilhamento entre dispositivos. A API é usada para demonstrar o envio de texto; as fotos e coordenadas são armazenadas localmente.

## Integrantes
Marcos e Heloísa