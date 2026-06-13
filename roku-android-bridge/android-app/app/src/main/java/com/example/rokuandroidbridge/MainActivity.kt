package com.example.rokuandroidbridge

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.rokuandroidbridge.databinding.ActivityMainBinding
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnCast.setOnClickListener {
            val ip = binding.etRokuIp.text.toString().trim()
            val url = binding.etStreamUrl.text.toString().trim()

            if (ip.isEmpty() || url.isEmpty()) {
                binding.tvStatus.text = "Please enter both IP and Stream URL"
                return@setOnClickListener
            }

            castToRoku(ip, url)
        }
    }

    private fun castToRoku(ip: String, streamUrl: String) {
        binding.tvStatus.text = "Attempting to cast..."
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // ECP command to launch the dev channel and pass streamUrl
                // Requires the app to be sideloaded as 'dev' channel
                val encodedUrl = URLEncoder.encode(streamUrl, "UTF-8")
                val ecpUrl = "http://$ip:8060/launch/dev?streamUrl=$encodedUrl"

                val url = URL(ecpUrl)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.connectTimeout = 5000
                connection.readTimeout = 5000

                val responseCode = connection.responseCode

                withContext(Dispatchers.Main) {
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        binding.tvStatus.text = "Cast command sent successfully!"
                    } else {
                        binding.tvStatus.text = "Failed. Response code: $responseCode"
                    }
                }
                connection.disconnect()
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.tvStatus.text = "Error: ${e.message}"
                }
            }
        }
    }
}
